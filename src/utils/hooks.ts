import React, { useState, useRef, useCallback } from 'react';
import isPlainObject from 'lodash/isPlainObject';

type Patch<State> = (
    patch: Partial<State> | ((prevPatch: State) => Partial<State>)
) => void;

type ExcludeT<State> = Exclude<Extract<State, object>, Function>;

export function useSetState<T>(
    initialState: ExcludeT<T>
): [ExcludeT<T>, Patch<ExcludeT<T>>] {
    if (!isPlainObject(initialState)) {
        throw new Error('state is not Plain Object');
    }
    const [state, setState] = useState(initialState);
    const setUseState: Patch<ExcludeT<T>> = useCallback(
        patch =>
            setState(prevState => ({
                ...prevState,
                ...(patch instanceof Function ? patch(prevState) : patch),
            })),
        [setState]
    );
    return [state, setUseState];
}


export type ShouldUpdateFunc<T> = (prev: T | undefined, next: T) => boolean;

const defaultShouldUpdate = <T>(a?: T, b?: T) => a !== b;

export function usePrevious<T>(
  state: T,
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
): T | undefined {
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  if (shouldUpdate(curRef.current, state)) {
    prevRef.current = curRef.current;
    curRef.current = state;
  }

  return prevRef.current;
}
