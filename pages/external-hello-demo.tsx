import React from "react"
import ReactDOM from "react-dom"
import { useExternalModule } from "~/lib/external-module"
import { HelloModule } from "~/lib/hello"
// import { useLazyModule } from "~/lib/use-lazy-module"

const value = `# Heading

Lorem ipsum dolar sit amet consecteteur.`

export default function () {
  const externalModule = useExternalModule<HelloModule>(
    "http://localhost:3005/build/hello/iife/index.js",
    "__hello__",
    {
      __hello_globals__: {
        React,
        ReactDOM,
      },
    }
  )

  if (!externalModule.ready) {
    return <div>Loading...</div>
  }

  const { Hello } = externalModule.module

  return (
    <div>
      <Hello />
    </div>
  )
}
