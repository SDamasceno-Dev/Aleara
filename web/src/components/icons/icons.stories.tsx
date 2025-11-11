import type { Meta, StoryObj } from "@storybook/react";
import { GoogleIcon } from "@/components/icons";

const meta = {
  title: "Components/Icons/Google",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <GoogleIcon className="h-6 w-6 text-red-500" />,
};


