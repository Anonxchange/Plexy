import type { SVGProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckIcon,
  Search01Icon,
  ShoppingCart01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";

type HeaderIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number;
  color?: string;
};
type IconData = React.ComponentProps<typeof HugeiconsIcon>["icon"];

function createHeaderIcon(icon: IconData) {
  return function HeaderIcon({
    size = 20,
    strokeWidth = 1.75,
    color,
    ...props
  }: HeaderIconProps) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        {...props}
      />
    );
  };
}

export const Check = createHeaderIcon(CheckIcon);
export const Search = createHeaderIcon(Search01Icon);
export const ShoppingCart = createHeaderIcon(ShoppingCart01Icon);
export const User = createHeaderIcon(User02Icon);
