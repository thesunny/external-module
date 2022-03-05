import React from "react"
import { useExternalModule } from "~/lib/external-module"
import { HelloModule } from "~/lib/hello"
import { Layout } from "~/components/layout"

/**
 * Proof of Concept of an external module
 */
export default function UseExternalModuleProof() {
  const externalHelloModule = useExternalModule<HelloModule>(
    "http://localhost:3005/build/hello/iife/index.js",
    "__hello__",
    /**
     * These load the global variables which are expected by the IIFE to exist
     * in the browser environment.
     */
    { __hello_globals__: { React } }
  )
  if (externalHelloModule.ready) {
    const { Hello } = externalHelloModule.module
    return (
      <Layout>
        <Hello />
      </Layout>
    )
  }
  return <Layout>Loading...</Layout>
}
