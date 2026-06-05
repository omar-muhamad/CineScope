import { render } from '@testing-library/react';
import Heading from '@/components/ui/Heading';

describe('Heading', () => {
  it('renders correctly with different props', () => {
    const { rerender, getByText } = render(<Heading as="h1">Test Heading</Heading>);
    expect(getByText('Test Heading').tagName).toBe('H1');

    rerender(<Heading as="h2">Test Heading</Heading>);
    expect(getByText('Test Heading').tagName).toBe('H2');

    rerender(<Heading as="h3" size="sm">Test Heading</Heading>);
    expect(getByText('Test Heading').tagName).toBe('H3');
    expect(getByText('Test Heading')).toHaveClass('antialiased text-lg font-outfitMedium');

    rerender(<Heading as="h4" size="md" className="extra-class">Test Heading</Heading>);
    expect(getByText('Test Heading').tagName).toBe('H4');
    expect(getByText('Test Heading')).toHaveClass('antialiased text-2xl font-outfitMedium extra-class');
  });
});