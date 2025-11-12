import type { Meta, StoryObj } from '@storybook/react';
import { DialogProvider, useDialog } from '@/components/dialog';

const meta = {
  title: 'Components/Dialog',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Demo({ intent }: { intent: 'alert' | 'warning' | 'message' }) {
  const dialog = useDialog();
  return (
    <button
      className='rounded-md bg-(--wine) px-3 py-2 text-white'
      onClick={() =>
        dialog.open({
          intent,
          title: 'Exemplo de diálogo',
          description:
            'Este é um conteúdo de exemplo. Você pode colocar qualquer JSX aqui.',
        })
      }
    >
      Abrir ({intent})
    </button>
  );
}

export const Message: Story = {
  render: () => (
    <DialogProvider>
      <Demo intent='message' />
    </DialogProvider>
  ),
};

export const Warning: Story = {
  render: () => (
    <DialogProvider>
      <Demo intent='warning' />
    </DialogProvider>
  ),
};

export const Alert: Story = {
  render: () => (
    <DialogProvider>
      <Demo intent='alert' />
    </DialogProvider>
  ),
};
