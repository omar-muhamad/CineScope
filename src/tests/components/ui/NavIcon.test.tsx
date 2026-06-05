import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FaHome } from 'react-icons/fa';
import NavIcon from '@/components/ui/NavIcon';

describe('NavIcon', () => {
  it('renders correctly with given props', () => {
    const mockLink = {
      id: 1,
      path: '/home',
      title: 'Home',
      icon: FaHome as IconType,
    };

    render(
      <Router>
        <NavIcon link={mockLink} />
      </Router>
    );

    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', mockLink.path);
  });
});