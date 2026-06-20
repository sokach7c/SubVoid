// @ts-nocheck
"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  Alert02Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BotIcon,
  CheckmarkCircle02Icon,
  CheckmarkSquare03Icon,
  Copy01Icon,
  DashboardSquare01Icon,
  Database01Icon,
  Delete02Icon,
  DeliveryBox01Icon,
  Download01Icon,
  EyeIcon,
  File01Icon,
  FilterIcon,
  Globe02Icon,
  HelpCircleIcon,
  Home01Icon,
  InformationCircleIcon,
  Layers01Icon,
  LibraryIcon,
  Link02Icon,
  Loading03Icon,
  LockIcon,
  Login03Icon,
  Logout03Icon,
  Menu01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  RefreshIcon,
  Search01Icon,
  ServerStack01Icon,
  Settings02Icon,
  Shield01Icon,
  UserShield01Icon,
  ShuffleIcon,
  SlidersHorizontalIcon,
  StarIcon,
  Upload01Icon,
  UserIcon,
  ViewIcon,
  XVariableIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

type IconDefinition = React.ComponentProps<typeof HugeiconsIcon>["icon"];
export type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function makeIcon(icon: IconDefinition): LucideIcon {
  const Component = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    ({ className, strokeWidth: _strokeWidth, ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        className={className}
        {...props}
      />
    )
  );
  Component.displayName = "ClashHugeIcon";
  return Component;
}

export const AlertCircle = makeIcon(AlertCircleIcon);
export const AlertTriangle = makeIcon(Alert02Icon);
export const ArrowDown = makeIcon(ArrowDown01Icon);
export const ArrowRight = makeIcon(ArrowRight01Icon);
export const ArrowRightLeft = makeIcon(ShuffleIcon);
export const ArrowUp = makeIcon(ArrowUp01Icon);
export const Bot = makeIcon(BotIcon);
export const Check = makeIcon(CheckmarkCircle02Icon);
export const CheckCircle = makeIcon(CheckmarkCircle02Icon);
export const CheckCircle2 = makeIcon(CheckmarkCircle02Icon);
export const ChevronDown = makeIcon(ArrowDown01Icon);
export const ChevronLeft = makeIcon(ArrowLeft01Icon);
export const ChevronRight = makeIcon(ArrowRight01Icon);
export const ChevronUp = makeIcon(ArrowUp01Icon);
export const Circle = makeIcon(CheckmarkCircle02Icon);
export const Clock = makeIcon(RefreshIcon);
export const Copy = makeIcon(Copy01Icon);
export const Database = makeIcon(Database01Icon);
export const Download = makeIcon(Download01Icon);
export const ExternalLink = makeIcon(Link02Icon);
export const Eye = makeIcon(EyeIcon);
export const EyeOff = makeIcon(ViewIcon);
export const FileCode = makeIcon(File01Icon);
export const Filter = makeIcon(FilterIcon);
export const Globe = makeIcon(Globe02Icon);
export const Heart = makeIcon(StarIcon);
export const HelpCircle = makeIcon(HelpCircleIcon);
export const Home = makeIcon(Home01Icon);
export const Info = makeIcon(InformationCircleIcon);
export const Layers = makeIcon(Layers01Icon);
export const Library = makeIcon(LibraryIcon);
export const Link = makeIcon(Link02Icon);
export const Link2 = makeIcon(Link02Icon);
export const List = makeIcon(File01Icon);
export const ListChecks = makeIcon(CheckmarkSquare03Icon);
export const ListOrdered = makeIcon(File01Icon);
export const Loader2 = makeIcon(Loading03Icon);
export const Lock = makeIcon(LockIcon);
export const LogIn = makeIcon(Login03Icon);
export const LogOut = makeIcon(Logout03Icon);
export const Maximize2 = makeIcon(ViewIcon);
export const Menu = makeIcon(Menu01Icon);
export const MoreVertical = makeIcon(MoreVerticalIcon);
export const Network = makeIcon(Globe02Icon);
export const Pencil = makeIcon(PencilEdit02Icon);
export const Plus = makeIcon(Add01Icon);
export const RefreshCcw = makeIcon(RefreshIcon);
export const RefreshCw = makeIcon(RefreshIcon);
export const RotateCcw = makeIcon(RefreshIcon);
export const Search = makeIcon(Search01Icon);
export const Server = makeIcon(ServerStack01Icon);
export const ServerCog = makeIcon(ServerStack01Icon);
export const Settings = makeIcon(Settings02Icon);
export const Settings2 = makeIcon(Settings02Icon);
export const Shield = makeIcon(Shield01Icon);
export const ShieldCheck = makeIcon(UserShield01Icon);
export const Shuffle = makeIcon(ShuffleIcon);
export const SlidersHorizontal = makeIcon(SlidersHorizontalIcon);
export const Trash2 = makeIcon(Delete02Icon);
export const Upload = makeIcon(Upload01Icon);
export const User = makeIcon(UserIcon);
export const X = makeIcon(XVariableIcon);
export const XCircle = makeIcon(Alert01Icon);
export const Zap = makeIcon(ZapIcon);
export const Box = makeIcon(DeliveryBox01Icon);
export const LayoutDashboard = makeIcon(DashboardSquare01Icon);
