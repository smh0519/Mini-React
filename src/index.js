import React from "./react.js";

// ----------------------------------------------------
// 🌟 여기서부터는 우리가 방금 만든 React를 사용하는 코드입니다!
// ----------------------------------------------------

// 1. JSX 대신 우리가 만든 createElement로 태그를 만듭니다.
// (나중에는 바벨(Babel)이 JSX를 이 코드로 자동 변환해 줍니다)
const element = React.createElement(
  "div",
  { id: "app-container", style: "padding: 20px; border: 2px solid blue;" },
  React.createElement("h1", null, "Hello, Mini React! 🚀"),
  React.createElement("p", null, "내가 직접 만든 리액트 엔진이 돌아가고 있습니다."),
  React.createElement(
    "ul",
    null,
    React.createElement("li", null, "Virtual DOM 만들기: 완료!"),
    React.createElement("li", null, "Fiber 아키텍처: 완료!"),
    React.createElement("li", null, "동시성 모드: 완료!")
  )
);

// 2. HTML에 있는 <div id="root"></div>를 가져옵니다.
// (CodeSandbox 기본 템플릿에 들어있거나, 직접 HTML에 만드시면 됩니다)
const container = document.getElementById("root");

// 3. 엔진 시동 켜기!
React.render(element, container);