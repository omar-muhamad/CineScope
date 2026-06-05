import { Component, ErrorInfo, ReactNode } from "react";
import { BsExclamationCircle } from "react-icons/bs";

import Heading from "../ui/Heading";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full md:w-[calc(100%-8rem)] h-screen fixed md:right-0 px-5 md:px-0 flex justify-center items-center">
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
