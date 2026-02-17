import React from "./react.js"

const element = React.createElement(
    "div",
    { id: "foo" },
    React.createElement("h1", {style:'color :blue'}, "Hello Mini React"),
    React.createElement("p", null, "This is pure JS!")
)

const container = document.getElementById("root")
React.render(element, container)