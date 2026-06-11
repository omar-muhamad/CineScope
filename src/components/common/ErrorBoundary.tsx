import { Component, ErrorInfo, ReactNode } from "react";
import { BsExclamationCircle } from "react-icons/bs";

import Heading from "../ui/Heading";

interface Props {
  children?: ReactNode;
  /**
   * Section-level error UI. When provided it replaces the default full-screen
   * fallback. May be a node, or a render function that receives a `retry`
   * callback (clears the error and runs `onReset`).
   */
  fallback?: ReactNode | ((retry: () => void) => ReactNode);
  /** Run when the boundary resets — manual retry or a `resetKeys` change. */
  onReset?: () => void;
  /**
   * When any value here changes while errored, the boundary auto-resets — e.g.
   * pass the route so navigating away from a broken page recovers it.
   */
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
}

const keysChanged = (a: unknown[] = [], b: unknown[] = []) =>
  a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (
      this.state.hasError &&
      keysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  private reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback !== undefined) {
        return typeof fallback === "function" ? fallback(this.reset) : fallback;
      }
      return (
        <div className="w-full h-screen fixed inset-0 px-5 flex justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-4">
            <BsExclamationCircle className="text-6xl md:text-7xl text-orange" />
            <Heading as="h1" className="text-center text-orange">
              There is an error
            </Heading>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
