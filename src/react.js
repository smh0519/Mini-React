// 설명: 함수들이 쪼개지면서 상태를 공유해야 하므로 전역 변수가 필요합니다.
let nextUnitOfWork = null; // 다음에 처리할 Fiber 작업 단위
let wipRoot = null;        // 현재 작업 중인 트리(Work In Progress Root) - 나중에 한 번에 커밋하기 위해 필요
let currentRoot = null;    // 이전에 커밋된(현재 화면에 있는) 트리
let deletions = null;      // 지워야 할 노드들을 담아둘 배열

// 역할: "주문서(설계도) 만들기"
// 설명: 개발자가 JSX로 작성한 코드(<div id="app">...</div>)를 
// 브라우저가 이해하기 쉬운 자바스크립트 객체(Virtual DOM) 형태로 변환해주는 함수입니다.
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(element => {
        if (typeof element == 'object') {
          return element
        } else {
          return createTextElement(element)
        }
      })
    }
  }
};

// 역할: "텍스트도 객체로 포장하기"
// 설명: 리액트 내부에서는 일반 문자열("Hello")도 하나의 엘리먼트로 취급해야 관리가 편합니다.
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text, // 1. 글자는 nodeValue라는 이름으로 저장
      children: []     // 2. 글자 안에는 자식이 없으니 빈 배열
    }
  }
};

function createDom(fiber) {
  // 1. dom 노드 생성 (텍스트인지 태그인지 구분)
  // 텍스트 엘리먼트면 createTextNode로 만들고, 일반 태그면 createElement로 만듭니다.
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  // 2. 속성(props) 부여 (children 제외하고 필터링해서 넣기)
  // 객체의 키값들(id, className 등)만 뽑아서 진짜 DOM에 넣어줍니다.
  const isProperty = key => key !== "children"

  Object.keys(fiber.props)
    .filter(isProperty)       // 'children'이라는 이름의 키는 제외!
    .forEach(name => {
      dom[name] = fiber.props[name] // 예: dom.id = "app", dom.nodeValue = "Hello"
    })

  // 3. 만들어진 dom 리턴하기
  // 이제 진짜 브라우저 태그가 완성되었으니 밖으로 내보냅니다.
  return dom
}


// 이벤트인지 확인하는 함수 (이름이 'on'으로 시작하는가?)
const isEvent = key => key.startsWith("on");

// 일반 속성인지 확인하는 함수 ('children'이 아니고, 이벤트도 아닌가?)
const isProperty = key => key !== "children" && !isEvent(key);

// 이전 값과 다른 새로운 값인지 확인하는 함수
const isNew = (prev, next) => key => prev[key] !== next[key];

// 아예 사라진 값인지 확인하는 함수 (새로운 속성에 이 이름이 없는가?)
const isGone = (prev, next) => key => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // 1. 없어지거나 변경된 "옛날 이벤트 리스너(onClick 등)" 제거
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // 2. 사라진 "옛날 속성들(style, id 등)" 지우기
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = "";
    });
  // 3. 새롭게 추가되거나 내용이 바뀐 "새 속성들" 적용하기
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });
  // 4. 새로운 "이벤트 리스너" 등록하기
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}


// 역할: "주문서대로 실제 건물 짓기"
function render(element, container) {
  // 1. wipRoot 객체 초기화
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot, // 이전 루트를 현재 루트의 alternate로 연결
    child: null,
    sibling: null,
    parent: null
  }
  deletions = [] // 새로운 렌더링이 시작될 때마다 삭제 배열 초기화

  // 2. nextUnitOfWork를 wipRoot로 설정 (작업 시작 알림)
  nextUnitOfWork = wipRoot
}

// 역할: 브라우저가 한가할 때(deadline) 야금야금 작업을 실행하는 루프
function workLoop(deadline) {
  // 1. while 문: (할 일이 남아있고 && 시간이 충분하다면) 반복
  //    - nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  //    - 시간이 없으면(deadline.timeRemaining() < 1) 루프 멈춤
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  // 2. 만약 할 일이 다 끝났다면(nextUnitOfWork가 없다면) && wipRoot가 있다면?
  //    - commitRoot() 호출해서 실제 DOM에 반영!
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  // 4. 다음 유휴 시간에 이 함수가 다시 실행되도록 requestIdleCallback 예약
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop);

// const newFiber = {
//   type: element.type,
//   props: element.props,
//   dom: null,
//   parent: fiber,    // 부모 누구?
//   child: null,      // 첫째 자식 누구?
//   sibling: null,    // 내 동생 누구?
// };



let wipFiber = null; // [Hooks] 현재 작업 중인 함수형 컴포넌트 Fiber (전역 저장소)
let hookIndex = null; // [Hooks] 현재 호출되는 훅(useState)의 순서

// 역할: Fiber 하나를 처리하고, "다음 처리할 Fiber"를 반환하는 함수
function performUnitOfWork(fiber) {
  // 1. 함수형 컴포넌트인지 일반 HTML 태그(Host Component)인지 확인합니다.
  const isFunctionComponent = fiber.type instanceof Function;

  // 2. 타입에 따라 다르게 업데이트를 진행합니다.
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 3. 다음 작업 단위(Fiber) 반환 (탐색 순서 중요!)
  //    - 1순위: 자식이 있으면 자식 반환
  if (fiber.child) {
    return fiber.child;
  }
  //    - 2순위: 자식이 없으면 형제(sibling) 반환
  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    //3순위: 형제도 없으면? 부모님 댁으로 올가기
    // 부모님한테 가서 "아빠 형제(삼촌) 있어요?" 라고 물어보기 위해 루프를 돕니다.
    nextFiber = nextFiber.parent
  }
}

function updateFunctionComponent(fiber) {

  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  // 핵심: 일반 태그는 children이 배열로 그냥 들어오지만,
  // 함수형 컴포넌트는 함수(App) 그 자체를 실행(호출)해야만 리턴값(자식들)을 받을 수 있습니다!
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // 1. 일반 태그는 예전처럼 DOM을 직접 생성합니다.
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 2. 자식들을 배열 그대로 넘겨서 Fiber로 만듭니다.
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

// [Hooks] 상태 관리의 핵심: useState 구현하기
function useState(initial) {
  // 1. 내 과거 모습(wipFiber.alternate)에서 예전의 나(hookIndex)를 꺼내봅니다.
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // 2. 훅을 만듭니다. (과거가 있으면 그 상태를 물려받고, 처음이면 초기값을 넣습니다)
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [], // setState가 여러 번 불릴 것에 대비한 대기열(줄서기)
  };

  // 3. 쌓여있던 밀린 일(상태 변경 예약건)들을 한꺼번에 처리합니다.
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    // action이 함수면 리턴값을 결과로, 값이면 그대로 결과로 처리
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  // 4. 컴포넌트에게 건네줄 상태 변경 스위치(setState)입니다.
  const setState = action => {
    // 화면을 당장 바꾸지 않고, 큐(대기열)에 변경할 값을 살포시 넣어둡니다.
    hook.queue.push(action);

    // 🔥 그리고 화면 전체를 "처음부터 다시 그려랏!" 하고 렌더링 엔진을 깨워버립니다.
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot, // 내 과거는 지금 그려져 있는 화면!
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // 5. 방금 만든 따끈따끈한 내 훅을 컴포넌트(Fiber) 허리춤에 묶어둡니다.
  wipFiber.hooks.push(hook);
  hookIndex++; // "다음번 useState야 넌 1번 칸에 들어가~" 하고 인덱스 증가

  // 짜잔! 우리가 맨날 쓰는 const [count, setCount] 형태 완성
  return [hook.state, setState];
}

// 이전 렌더링에서 만들어둔 기존 Fiber 트리(oldFiber)와 이번에 새로 받은 React 엘리먼트 배열(elements)을 비교합니다.
// 반복문을 돌면서 하나하나 비교(태그 이름 비교 등)를 진행합니다.
// 단순히 자식 노드를 생성하는 것이 아니라, 비교 결과에 따라 새로운 Fiber 노드에 effectTag라는 꼬리표를 달아줍니다.
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // wipFiber.alternate가 있으면 그 자식(이전 렌더링 때의 자식)부터 비교 시작
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // 엘리먼트 배열을 다 돌거나, 비교할 이전 Fiber가 남아있을 때까지 반복
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // 1. 타입이 같은지 비교 (예: 둘 다 div인지?)
    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      // UPDATE: 타입이 같으면 기존 DOM을 재사용하고 속성만 바꿈
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom, // 기존 DOM 객체를 그대로 재사용
        parent: wipFiber,
        alternate: oldFiber, // 이전 Fiber 기억하기
        effectTag: "UPDATE", // 나중에 속성만 업데이트하라고 꼬리표 붙임
      };
    }
    if (element && !sameType) {
      // PLACEMENT: 엘리먼트가 새로 생겼거나 타입이 다르면 새로 DOM을 만들어야 함
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // 나중에 새로 만들 것
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT", // 나중에 통째로 부모에 붙이라고 꼬리표 붙임
      };
    }
    if (oldFiber && !sameType) {
      // DELETION: 이전엔 있었는데 지금은 없거나, 타입이 달라져서 이전 DOM을 버려야 함
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // 나중에 DOM에서 지우기 위해 쓰레기통에 담아둠
    }

    // 다음 비교를 위해 oldFiber도 다음 형제(sibling)로 넘어감
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 생성된 newFiber를 현재 Fiber(wipFiber)의 자식이나 이전 형제의 sibling으로 연결
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}



// 역할: 작업이 다 끝난 트리(wipRoot)를 실제 DOM에 한 번에 붙여주는 역할

function commitRoot() {
  // 1. 화면을 그리기 전에, 쓰레기통(deletions)에 모아둔 지울 노드들부터 싹 없애줍니다!
  deletions.forEach(commitWork);

  // 2. 그 다음 새로운 트리를 화면에 그립니다.
  commitWork(wipRoot.child);

  // 현재 완성된 트리를 currentRoot로 저장하여 나중에 비교할 수 있게 함
  currentRoot = wipRoot;

  // 3. wipRoot = null (작업 완료했으니 초기화)
  wipRoot = null;
}

function commitWork(fiber) {
  // 1. 종료 조건: fiber가 없으면(끝까지 다 돌았으면) 함수 종료
  if (!fiber) {
    return
  }

  // 2. 부모 DOM 찾기: 내 진짜 부모의 DOM을 가져옵니다.
  // 🚨 주의: 함수형 컴포넌트는 실제 브라우저 DOM 노드(div, span)가 없습니다!
  // 따라서 실제 DOM을 가진 할아버지/증조할아버지를 만날 때까지 거슬러 올라가야 합니다.
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  // 3. 꼬리표(effectTag) 확인하고 다르게 작업하기

  // 상황 1. 새로 화면에 붙여야 할 때 (PLACEMENT)
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  }

  // 상황 2. 화면에 있는 속성만 갈아끼워야 할 때 (UPDATE)
  else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  // 상황 3. 화면에서 지워야 할 때 (DELETION)
  else if (fiber.effectTag === "DELETION") {
    // 지우려는 노드 역시 함수형 컴포넌트일 수 있으므로(dom이 없음) 특별하게 지웁니다.
    commitDeletion(fiber, domParent);
  }


  // 4. 재귀 호출 (자식과 형제도 똑같이 처리해라!)
  // 내 첫째 자식(child)을 commitWork로 넘깁니다.
  if (fiber.child) {
    commitWork(fiber.child)
  }

  // 내 동생(sibling)도 commitWork로 넘깁니다.
  /* 여기에 작성하세요 */
  if (fiber.sibling) {
    commitWork(fiber.sibling)
  }
}

// 부모 DOM에서 자식을 완전히 뜯어내는 함수
function commitDeletion(fiber, domParent) {
  // 지우려는 fiber에 진짜 화면(dom)이 있으면 깔끔하게 부모에서 제거!
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    // 🚨 만약 함수형 컴포넌트라서 나한테 dom이 없다면?
    // 내 진짜 화면(dom)을 가진 핏줄(자식)을 찾을 때까지 거슬러 내려가서 그걸 지우라고 명령합니다.
    commitDeletion(fiber.child, domParent);
  }
}

const React = {
  createElement,
  render,
  useState,
}

export default React
