import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/button";
import { GoogleIcon } from "@/components/icons";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  render: () => <Button intent="primary">Primary</Button>,
};

export const Gold: Story = {
  render: () => <Button intent="gold">Gold</Button>,
};

export const OutlineInfo: Story = {
  render: () => <Button variant="outline" intent="info">Info</Button>,
};

export const GhostSuccessWithIcon: Story = {
  render: () => <Button variant="ghost" intent="success" leftIcon={<GoogleIcon className="h-4 w-4" />}>Entrar com Google</Button>,
};


