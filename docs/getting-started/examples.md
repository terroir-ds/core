# Examples

See Terroir Core in action with these practical examples. Each example demonstrates key concepts and best practices for building with the design system.

## Interactive Examples

### CodeSandbox Templates

Start building immediately with our pre-configured templates:

- **[React Starter](https://codesandbox.io/s/terroir-react-starter)** - Basic React setup with Terroir Core
- **[Vue Starter](https://codesandbox.io/s/terroir-vue-starter)** - Vue 3 with Composition API
- **[Vanilla JS](https://codesandbox.io/s/terroir-vanilla-starter)** - No framework required
- **[Next.js App](https://codesandbox.io/s/terroir-nextjs-starter)** - Server-side rendering example

### Live Playground

Experiment with our components in the [Storybook playground](https://storybook.terroir-core.dev):

- Interactive component examples
- Live theme switching
- Accessibility testing tools
- Code export functionality

## Common Patterns

### 1. Theme Switcher

Implement light/dark mode switching with automatic persistence:

```typescript
import { ThemeProvider, useTheme } from '@terroir/react';
import { generateColorSystem } from '@terroir/core/colors';

function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => {
    // Check user preference
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved || (prefersDark ? 'dark' : 'light');
  });

  const colors = useMemo(() => 
    generateColorSystem({
      source: '#0066cc',
      isDark: theme === 'dark'
    }), [theme]
  );

  return (
    <ThemeProvider theme={{ colors, mode: theme }}>
      <App onThemeToggle={() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
      }} />
    </ThemeProvider>
  );
}
```

### 2. Responsive Navigation

Mobile-first navigation with accessibility built-in:

```typescript
import { Button, IconButton, Drawer } from '@terroir/react';
import { MenuIcon, CloseIcon } from '@terroir/icons';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  return (
    <>
      <nav aria-label="Main navigation">
        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-4">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>

        {/* Mobile Menu Button */}
        <IconButton
          className="md:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-controls={menuId}
          aria-expanded={isOpen}
        >
          <MenuIcon />
        </IconButton>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        id={menuId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="right"
      >
        <nav aria-label="Mobile navigation">
          <IconButton
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="ml-auto"
          >
            <CloseIcon />
          </IconButton>
          
          <ul className="flex flex-col gap-4 mt-8">
            <li><a href="/" onClick={() => setIsOpen(false)}>Home</a></li>
            <li><a href="/about" onClick={() => setIsOpen(false)}>About</a></li>
            <li><a href="/contact" onClick={() => setIsOpen(false)}>Contact</a></li>
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
```

### 3. Form with Validation

Accessible form with real-time validation and error handling:

```typescript
import { Form, Input, Button, ErrorMessage } from '@terroir/react';
import { validateEmail } from '@terroir/core/utils';

function ContactForm() {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    
    // Validate
    const newErrors = {};
    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    // Submit form
    try {
      await submitForm(formData);
      // Handle success
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Input
        type="email"
        name="email"
        label="Email Address"
        required
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'email-error' : 'email-hint'}
      />
      <span id="email-hint" className="text-sm text-neutral-60">
        We'll never share your email
      </span>
      {errors.email && (
        <ErrorMessage id="email-error" role="alert">
          {errors.email}
        </ErrorMessage>
      )}
      
      <Button 
        type="submit" 
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
      
      {errors.submit && (
        <ErrorMessage role="alert">{errors.submit}</ErrorMessage>
      )}
    </Form>
  );
}
```

### 4. Data Table

Sortable, accessible data table with responsive design:

```typescript
import { Table, TableHead, TableBody, TableRow, TableCell } from '@terroir/react';

function UserTable({ users }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return users;
    
    return [...users].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Table aria-label="Users table">
      <TableHead>
        <TableRow>
          <TableCell 
            as="th"
            onClick={() => handleSort('name')}
            aria-sort={
              sortConfig.key === 'name' 
                ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
          >
            Name
          </TableCell>
          <TableCell as="th">Email</TableCell>
          <TableCell as="th">Role</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedUsers.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 5. Card Grid Layout

Responsive card grid with proper semantics:

```typescript
import { Card, CardHeader, CardBody, CardFooter, Button } from '@terroir/react';

function ProductGrid({ products }) {
  return (
    <section aria-labelledby="products-heading">
      <h2 id="products-heading" className="sr-only">Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <img 
                src={product.image} 
                alt={product.imageAlt}
                className="w-full h-48 object-cover"
              />
            </CardHeader>
            
            <CardBody>
              <h3 className="heading-3">{product.name}</h3>
              <p className="text-neutral-60">{product.description}</p>
              <p className="text-lg font-semibold mt-2">
                ${product.price.toFixed(2)}
              </p>
            </CardBody>
            
            <CardFooter>
              <Button variant="primary" fullWidth>
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

## Full Application Examples

### Blog Template

A complete blog with:

- Accessible navigation
- Theme switching
- Responsive layout
- SEO optimization

[View on GitHub](https://github.com/terroir-core/examples/tree/main/blog)

### E-commerce Site

Full shopping experience featuring:

- Product catalog
- Shopping cart
- Checkout flow
- Order management

[View on GitHub](https://github.com/terroir-core/examples/tree/main/ecommerce)

### Dashboard

Admin dashboard showcasing:

- Data visualization
- Complex forms
- Real-time updates
- Role-based access

[View on GitHub](https://github.com/terroir-core/examples/tree/main/dashboard)

## Integration Examples

### With Next.js

Server-side rendering setup:

```typescript
// pages/_app.tsx
import { TerroirProvider } from '@terroir/react';
import { generateColorSystem } from '@terroir/core/colors';

const theme = {
  colors: await generateColorSystem({ source: '#0066cc' })
};

export default function App({ Component, pageProps }) {
  return (
    <TerroirProvider theme={theme}>
      <Component {...pageProps} />
    </TerroirProvider>
  );
}
```

### With Tailwind CSS

Combine with Tailwind utilities:

```typescript
// tailwind.config.js
import { tokens } from '@terroir/core';

export default {
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
      },
      fontFamily: {
        sans: tokens.fonts.base,
        mono: tokens.fonts.mono,
      },
      spacing: tokens.spacing,
    }
  }
}
```

### With Styled Components

Use tokens in CSS-in-JS:

```typescript
import styled from 'styled-components';
import { tokens } from '@terroir/core';

const StyledButton = styled.button`
  background: ${tokens.colors.primary[60]};
  color: ${tokens.colors.primary[10]};
  padding: ${tokens.space.md} ${tokens.space.lg};
  border-radius: ${tokens.radii.md};
  font-weight: ${tokens.fontWeights.semibold};
  
  &:hover {
    background: ${tokens.colors.primary[70]};
  }
`;
```

## Testing Examples

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@terroir/react';

test('button handles click events', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();
  
  render(
    <Button onClick={handleClick}>
      Click me
    </Button>
  );
  
  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Testing

```bash
import { axe } from '@axe-core/react';
import { render } from '@testing-library/react';
import { Form } from './Form';

test('form has no accessibility violations', async () => {
  const { container } = render(<Form />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Resources

### Learning Materials

- [Video Tutorials](https://youtube.com/terroir-core) - Step-by-step guides
- [Code Challenges](https://challenges.terroir-core.dev) - Practice exercises
- [Community Forum](https://forum.terroir-core.dev) - Get help and share

### Development Tools

- [VS Code Extension](https://marketplace.visualstudio.com/terroir) - IntelliSense for tokens
- [Figma Plugin](https://figma.com/terroir-plugin) - Sync design tokens
- [Chrome DevTools](https://chrome.google.com/webstore/terroir) - Debug theme issues

## Contributing Examples

Have an interesting use case? We'd love to include it!

1. Fork the [examples repository](https://github.com/terroir-core/examples)
2. Add your example following our template
3. Submit a pull request

See [Contributing Guide](../guides/contributing/README.md) for details.

## Next Steps

- Explore the [Component Reference](../reference/components/README.md)
- Learn about [Theming](../guides/theming/README.md)
- Dive into [Advanced Patterns](../guides/patterns/README.md)
