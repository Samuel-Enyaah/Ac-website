import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main role="alert" className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-2xl font-bold text-[#0B1F33]">Something went wrong</h1>
      <p className="my-5">We could not display this page. Please try again or return to the home page.</p>
      <button className="min-h-11 rounded-xl bg-[#1687D9] px-5 text-white" onClick={() => this.setState({ failed: false })}>Try again</button>
      <a href="/" className="ml-5 underline">Home</a>
    </main>;
  }
}
