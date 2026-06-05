import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button />);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(<Button>Test Button</Button>);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveTextContent('Test Button');
  });

  it('applies the correct classes based on the rounded prop', () => {
    render(<Button rounded="full" />);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('rounded-full');
  });

  it('applies the correct classes based on the size prop', () => {
    render(<Button size="large" />);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('text-lg');
  });

  it('applies additional classes passed in the className prop', () => {
    render(<Button className="extra-class" />);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('extra-class');
  });
});