// 설명: 함수들이 쪼개지면서 상태를 공유해야 하므로 전역 변수가 필요합니다.
let nextUnitOfWork = null; // 다음에 처리할 Fiber 작업 단위
let wipRoot = null;        // 현재 작업 중인 트리(Work In Progress Root) - 나중에 한 번에 커밋하기 위해 필요

// 역할: "주문서(설계도) 만들기"
// 설명: 개발자가 JSX로 작성한 코드(<div id="app">...</div>)를 
// 브라우저가 이해하기 쉬운 자바스크립트 객체(Virtual DOM) 형태로 변환해주는 함수입니다.
function createElement(type,props,...children) {
  return {
    type,
    props : {
      ...props,
      children : children.map( element =>{
        if(typeof element == 'object'){
          return element
        }else{
          return createTextElement(element)
        }
    })
  }
}};

// 역할: "텍스트도 객체로 포장하기"
// 설명: 리액트 내부에서는 일반 문자열("Hello")도 하나의 엘리먼트로 취급해야 관리가 편합니다.
function createTextElement(text) {
  return {
    type : "TEXT_ELEMENT",
    props : {
      nodeValue: text, // 1. 글자는 nodeValue라는 이름으로 저장
      children: []     // 2. 글자 안에는 자식이 없으니 빈 배열
    }
  }
};

// 역할: Fiber를 받아서 실제 브라우저 DOM 노드를 생성하고 속성을 넣어주는 함수
// 힌트: 원래 render 함수 안에 있던 로직(document.createElement ~ dom[name]=props[name])을 여기로 가져오세요.
function createDom(fiber) {
  // 1. dom 노드 생성 (텍스트인지 태그인지 구분)
  
  // 2. 속성(props) 부여 (children 제외하고 필터링해서 넣기)

  // 3. 만들어진 dom 리턴하기
}

// 역할: "주문서대로 실제 건물 짓기"
function render(element, container) {
  // 1. wipRoot 객체 초기화
  //    - dom: container
  //    - props: { children: [element] }
  //    - child, sibling, parent: null로 시작

  // 2. nextUnitOfWork를 wipRoot로 설정 (작업 시작 알림)
}

// 역할: 브라우저가 한가할 때(deadline) 야금야금 작업을 실행하는 루프
function workLoop(deadline) {
  // 1. shouldYield 변수 선언 (양보해야 하는지 체크)

  // 2. while 문: (할 일이 남아있고 && 시간이 충분하다면) 반복
  //    - nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  //    - 시간이 없으면(deadline.timeRemaining() < 1) 루프 멈춤

  // 3. 만약 할 일이 다 끝났다면(nextUnitOfWork가 없다면) && wipRoot가 있다면?
  //    - commitRoot() 호출해서 실제 DOM에 반영!

  // 4. 다음 유휴 시간에 이 함수가 다시 실행되도록 requestIdleCallback 예약
}

// 역할: Fiber 하나를 처리하고, "다음 처리할 Fiber"를 반환하는 함수
function performUnitOfWork(fiber) {
  // 1. DOM 생성: 만약 fiber.dom이 없다면 createDom(fiber)로 만들어서 fiber.dom에 저장
  //    (주의: 여기서 appendChild로 부모에 붙이지 마세요! 그건 commit 단계에서 합니다.)

  // 2. 자식들(fiber.props.children)을 Fiber로 변환 (Reconciliation)
  //    - 자식 배열을 돌면서 새로운 Fiber 객체를 만듭니다.
  //    - 부모(parent), 자식(child), 형제(sibling) 관계를 연결해줍니다.
  //    - 첫 번째 자식은 fiber.child로, 나머지는 이전 형제의 sibling으로 연결!

  // 3. 다음 작업 단위(Fiber) 반환 (탐색 순서 중요!)
  //    - 1순위: 자식이 있으면 자식 반환
  //    - 2순위: 자식이 없으면 형제(sibling) 반환
  //    - 3순위: 형제도 없으면 부모의 형제(삼촌)를 찾을 때까지 위로 올라감(parent)
}

// 역할: 작업이 다 끝난 트리(wipRoot)를 실제 DOM에 한 번에 붙여주는 역할

function commitRoot() {
  // 1. commitWork(wipRoot.child) 호출 (루트의 자식부터 시작)
  // 2. wipRoot = null (작업 완료했으니 초기화)
}

function commitWork(fiber) {
  // 1. fiber가 없으면 리턴 (재귀 종료 조건)

  // 2. 부모 DOM 가져오기 (fiber.parent.dom)
  
  // 3. 부모 DOM에 내 DOM(fiber.dom) 붙이기 (appendChild)

  // 4. 자식으로 재귀 호출 (commitWork(fiber.child))
  
  // 5. 형제로 재귀 호출 (commitWork(fiber.sibling))
}

const React = {
  createElement,
  render,
}

export default React
