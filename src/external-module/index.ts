import React, { useEffect, useState } from "react"

import ReactDOM from "react-dom"

/**
 * Where the cached modules are stored
 */
declare global {
  interface Window {
    __externalModule_cache__?: { [key: string]: any }
  }
}

/**
 * Tries to grab the module from the cache if we are on the browser. Always
 * returns undefined on the server because the cache only exists on the
 * window object in the browser.
 *
 * @param url
 */
function getMaybeModule<T>(url: string): T | undefined {
  if (typeof window === "undefined") return undefined
  /**
   * Make sure there is a cache object
   */
  if (typeof window.__externalModule_cache__ === "undefined") {
    window.__externalModule_cache__ = {}
  }
  /**
   * If the module is in the cache, return it right away
   */
  const maybeModule = window.__externalModule_cache__[url]
  return maybeModule
}

/**
 * Loads a JavaScript file asynchronously.
 *
 * The file should be an IIFE that assigns a value to the `window` object.
 *
 * Our current practice is to use rollup config where `format: "iife"` and we
 * set `name: "THE_MODULE_KEY"` which is passed in as the second argument to
 * this `loadExternalModule` method.
 *
 * From the library file, we also export a type named something like
 * `MyNameModule` which is passed in as the generic to this `loadModule`
 * method so we know what types we are getting.
 *
 * @param url URL to a .js file where the module is loaded from
 * @param moduleKey The `name` in the `window` namespace to grab the module from
 */
export function loadExternalModule<T>(
  url: string,
  moduleKey: string
): Promise<T> {
  const maybeModule = getMaybeModule<T>(url)
  if (maybeModule) {
    return Promise.resolve<T>(maybeModule)
  }
  /**
   * Create the script tag and append it to the document
   */
  const script = document.createElement("script")
  script.src = url
  script.id = "dynamic_hello"
  document.body.appendChild(script)
  return new Promise<T>((resolve, reject) => {
    script.onload = () => {
      const mod = (window as any)[moduleKey] as T
      if (mod == null) {
        console.error(
          `Loaded script ${JSON.stringify(
            url
          )} but it did not set window.${moduleKey}`
        )
        return
      }
      if (typeof window.__externalModule_cache__ === "undefined") {
        window.__externalModule_cache__ = {}
      }
      window.__externalModule_cache__[url] = mod
      resolve(mod)
    }
  })
}

/**
 * External Module in a ready state
 */
type ReadyExternalModule<T> = {
  url: string
  ready: true
  cached: boolean
  spinner: false
  module: T
}

/**
 * External Module in a loading state
 */
type LoadingExternalModule = {
  url: string
  ready: false
  cached: false
  spinner: boolean
  module: undefined
}

/**
 * The return type of useExternalModule created as a discriminated union so
 * we know that when `ready` is `true` that `module` is defined.
 */
type ExternalModule<T> = ReadyExternalModule<T> | LoadingExternalModule

/**
 * Default value for loading an external module (less the URL).
 *
 * Useful because there are two places where this structure is used.
 */
const DEFAULT_LOADING_EXTERNAL_MODULE = {
  ready: false,
  cached: false,
  spinner: false,
  module: undefined,
} as const

/**
 * Loads a module from a URL. The module will define a variable in the window
 * namespace.
 *
 * When the module has been loaded, we grab the variable from the window
 * namespace and return it.
 *
 * It also returns a `ready` state. If the module is ready, you know that
 * the `module` property is defined in the return value.
 *
 * @param url URL to a .js file where the module is loaded from
 * @param moduleKey The `name` in the `window` namespace to grab the module from
 */
export function useExternalModule<T>(
  url: string,
  moduleKey: string,
  globals: object
): ExternalModule<T> {
  /**
   * Try grabbing the module from the cache during the initial setting of
   * state.
   */
  const [externalModule, setState] = useState<ExternalModule<T>>(() => {
    if (typeof window !== "undefined") {
      console.log("globals", globals)
      Object.assign(window, globals)
    }
    const maybeModule = getMaybeModule<T>(url)
    if (maybeModule) {
      return {
        url,
        ready: true,
        cached: true,
        spinner: false,
        module: maybeModule!,
      }
    } else {
      return { url, ...DEFAULT_LOADING_EXTERNAL_MODULE }
    }
  })
  /**
   * When the URL changes, we want to reset the state.
   *
   * We were able to simplify the logic a lot by moving this out of `useEffect`
   * where it was causing a lot of timing related issues.
   */
  if (url !== externalModule.url) {
    setState({ url, ...DEFAULT_LOADING_EXTERNAL_MODULE })
  }
  useEffect(() => {
    if (externalModule.cached) return
    /**
     * It's been a while so show the loading indicator
     */
    const timeoutId = setTimeout(() => {
      setState({
        url: externalModule.url,
        ready: false,
        cached: false,
        spinner: true,
        module: undefined,
      })
    }, 1000)
    /**
     * Once it's loaded, set ready to true and turn off the loading indicator
     */
    loadExternalModule<T>(url, moduleKey).then(function (mod) {
      clearTimeout(timeoutId)
      setState({
        url: externalModule.url,
        ready: true,
        cached: false,
        spinner: false,
        module: mod,
      })
    })
    /**
     * If the URL changes, start from scratch again
     */
    return function () {
      console.log("unload?")
      setState({
        url: externalModule.url,
        ready: false,
        cached: false,
        spinner: false,
        module: undefined,
      })
    }
  }, [externalModule.url])
  return externalModule
}
