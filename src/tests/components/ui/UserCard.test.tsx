import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { BrowserRouter as Router } from 'react-router-dom';
import UserCard from '@/components/ui/UserCard';

describe('UserCard', () => {
  const mockUser = {
    gravatar: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  id: 1234,
  name: "Omar"
  };

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <Router>
          <UserCard user={mockUser} isLogged={true} />
        </Router>
      </Provider>
    );
  });

  it('displays the correct user name when a user is logged in', () => {
    render(
      <Provider store={store}>
        <Router>
          <UserCard user={mockUser} isLogged={true} />
        </Router>
      </Provider>
    );
    expect(screen.getByText(`Hi, ${mockUser.name}!`)).toBeInTheDocument();
  });

  it('displays "Hi, User!" when no user is logged in', () => {
    render(
      <Provider store={store}>
        <Router>
          <UserCard user={null} isLogged={false} />
        </Router>
      </Provider>
    );
    expect(screen.getByText('Hi, User!')).toBeInTheDocument();
  });

  it('displays "Logout" button when a user is logged in', () => {
    render(
      <Provider store={store}>
        <Router >
          <UserCard user={mockUser} isLogged={true} />
        </Router>
      </Provider>
    );
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays "Login" button when no user is logged in', () => {
    render(
      <Provider store={store}>
        <Router>
          <UserCard user={null} isLogged={false} />
        </Router>
      </Provider>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router>
          <UserCard user={mockUser} isLogged={true} />
        </Router>
      </Provider>
    );
    fireEvent.click(getByText('Logout'));
    expect(localStorage.getItem('session_id')).toBeNull();
  });
});