import { CrashModule } from "~/lib/crash"
import React from "react"
import ReactDOM from "react-dom"
import { useExternalModule } from "~/lib/external-module"

export default function CrashPOC() {
  const externalHelloModule = useExternalModule<CrashModule>(
    "http://localhost:3005/build/crash/iife/index.js",
    "__crash__",
    { __globals__: { React, ReactDOM } }
  )
  if (externalHelloModule.ready) {
    const { crash } = externalHelloModule.module
    /**
     * When this page crashes, the Error should be pointing to the correct line
     * number. I think at a minimum, it is pointing to this line below; however,
     * I think ideally we want this to show the line number in the build
     * using the map.
     */
    crash()
    return <div>Crash</div>
  }
  return <div>Loading...</div>
}
