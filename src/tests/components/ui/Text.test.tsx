import { render, screen } from '@testing-library/react';
import Text from '@/components/ui/Text';

describe('Text', () => {
  it('renders correctly with default props', () => {
    render(<Text />);
    const textElement = screen.getByRole('paragraph');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveClass('antialiased');
    expect(textElement).toHaveClass('text-base');
  });

  it('renders correctly with size prop set to sm', () => {
    render(<Text size="sm" />);
    const textElement = screen.getByRole('paragraph');
    expect(textElement).toHaveClass('text-sm');
  });

  it('renders correctly with className prop', () => {
    const testClassName = 'test-class';
    render(<Text className={testClassName} />);
    const textElement = screen.getByRole('paragraph');
    expect(textElement).toHaveClass(testClassName);
  });

  it('renders correctly with children', () => {
    const testChildren = 'Test Children';
    render(<Text>{testChildren}</Text>);
    const textElement = screen.getByRole('paragraph');
    expect(textElement).toHaveTextContent(testChildren);
  });
});