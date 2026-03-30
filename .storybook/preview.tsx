import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          padding: '10px 0 0 10px',
        }}
      >
        <div style={{ flex: 1 }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
