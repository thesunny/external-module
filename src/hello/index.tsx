import React from "react"

/**
 * Export a function that returns `hello`
 */
export function hello(name: string) {
  return `Hello ${name}`
}

/**
 * Export a React Component
 */
export function Hello() {
  return <div>Hello World</div>
}

/**
 * Export a type definition used by `~/lib/external-module`
 */
export type HelloModule = { hello: typeof hello; Hello: typeof Hello }
