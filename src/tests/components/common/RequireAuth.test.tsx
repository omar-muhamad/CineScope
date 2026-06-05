import RequireAuth from "@/components/common/RequireAuth";
import { render, screen } from "@testing-library/react";


describe("Home Page", () => {
  afterEach(() => {
    localStorage.clear();
  });
  it("isUser should be true when session_id is in localStorage", () => {
    localStorage.setItem("session_id", "12345");
    const isUser = localStorage.getItem("session_id") ? true : false;
    expect(isUser).toBe(true);
  });

  it("isUser should be false when session_id is not in localStorage", () => {
    localStorage.clear();
    const isUser = localStorage.getItem("session_id") ? true : false;
    expect(isUser).toBe(false);
  });

  it('renders protected content when user is authenticated', () => {
    localStorage.setItem('session_id', '12345');
    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );
    expect(screen.queryByText('Page content is protected')).toBeNull();
    expect(screen.queryByText('Please Login First')).toBeNull();
  });

  it('renders login prompt when user is not authenticated', () => {
    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );
    expect(screen.getByText('Page content is protected')).toBeInTheDocument();
    expect(screen.getByText('Please Login First')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });
});
