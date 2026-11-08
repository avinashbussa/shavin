"use client";
// Public export surface for @shavin/ui — enterprise design tokens and UI primitives.
// Motion runtime self-boots on import (zero-setup legacy-browser reveal fallback + GSAP seam;
// modern browsers use the pure-CSS scroll-driven path and need no JS). `initMotionRuntime` is the
// explicit escape hatch for consumers whose bundler tree-shakes the side-effect import.
import "./lib/motion-runtime";
export { initMotionRuntime, motionConfig } from "./lib/motion-runtime";
export { cn } from "./lib/cn";
export { resolveBridgePort, bridgeOrigin, bridgeUrl, bridgeDashboardUrl, DEFAULT_BRIDGE_PORT, BRIDGE_HOST } from "./lib/bridge";
export { announce, type Politeness } from "./lib/announce";
export {
  concentricContainerStyle,
  concentricCompoundStyle,
  concentricBoundaryResetStyle,
  withConcentricStyle,
  cardPaddingToScale,
} from "./lib/concentric";

// Media overlays & background media (shared block registry media contract)
export {
  isVideoUrl,
  OVERLAY_PRESET_KEYS,
  hexToRgb,
  tokenNameToCssColor,
  tokenNameToCssVar,
  getPresetThumbnailStyle,
  getOverlayThumbnailStyle,
  parseOverlayLayers,
  parseOverlayShorthand,
  overlayLayersToShorthand,
  getOverlayLayerClass,
  getOverlayLayerStyle,
  renderBgMedia,
  renderOverlayLayers,
  renderOverlays,
  bgMediaLayer,
  type OverlayLayer,
  type BgMediaProps,
} from "./lib/media-overlays";

// Surface contrast scoping — layout primitive prop that forces a local token
// cascade (.dark / .light) regardless of page theme mode. See lib/surface.ts.
export { surfaceClass, type Surface } from "./lib/surface";

// Theme presets — backs ThemeProvider and the playground's Configurator.
export {
  ACCENT_PRESETS,
  GRAY_PRESETS,
  GRAY_STEPS,
  RADIUS_PRESETS,
  SCALING_PRESETS,
  DISPLAY_FONTS,
  BODY_FONTS,
  loadGoogleFont,
  parseGoogleFontEmbed,
  preloadGoogleFontsBundle,
  THEME_PRESETS,
  type ThemePreset,
  applyThemePreset,
  applyAccentColor,
  applyGrayColor,
  applyRadiusPreset,
  applyScalingPreset,
  applyPanelBackground,
  applyDisplayFontPreset,
  applyBodyFontPreset,
  applySubheadingFont,
  hexToTriplet,
  tripletToHex,
  resolveAccentTriplet,
  scopedThemeVars,
  accentForegroundFor,
  accentHoverFor,
  accentTextFor,
  resolveAccent,
  accentForegroundForOklch,
  accentHoverForOklch,
  accentTextForOklch,
} from "./lib/theme-presets";
export {
  type Oklch,
  type ColorSpace,
  hexToOklch,
  oklchToCss,
  oklchToRgbTriplet,
  oklchToHex,
  rgbTripletToOklch,
  oklchLuminance,
  oklchForegroundFor,
  oklchHoverFor,
  oklchTextFor,
  oklchAchromaticInversion,
  oklchMix,
  getColorSpace,
  setColorSpace,
} from "./lib/color-space";
export { ThemeProvider, ScopedThemeProvider, type ScopedThemeProviderProps, type ShavinThemeConfig } from "./primitives/ThemeProvider";
export {
  ThemeSwitcher,
  ThemeScript,
  useTheme,
  type ThemeSwitcherProps,
  type ThemeMode,
  type ThemeScriptProps,
} from "./primitives/ThemeSwitcher";

// Overlays / modals
export { Dialog, DialogClose, CloseButton, modalPanelVariants, type DialogProps } from "./primitives/Dialog";
export { Spotlight, type SpotlightProps } from "./primitives/Spotlight";
export { AlertDialog } from "./primitives/AlertDialog";
export { Drawer, drawerPanelVariants, type DrawerProps } from "./primitives/Drawer";
export { Menu, MenuTrigger, MenuItem, MenuSub, MenuSubTrigger, MenuSubContent } from "./primitives/Menu";
export { ContextMenu, ContextMenuItem } from "./primitives/ContextMenu";
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./primitives/Popover";
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./primitives/HoverCard";
export { Tooltip } from "./primitives/Tooltip";
export { ScrollArea } from "./primitives/ScrollArea";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, type AccordionProps } from "./primitives/Accordion";

// Form controls
export { Select, type Option, type OptionGroup } from "./primitives/Select";
export { Dropdown } from "./primitives/Dropdown";
export { DatePicker, type DatePickerTokens } from "./primitives/DatePicker";
export { TimePicker, TimePickerInput, TimePickerClock } from "./primitives/TimePicker";
export { ColorPicker, ColorPickerPopover, CanvasColorPickerPopup, type ColorPickerProps, type ColorPickerSwatch } from "./primitives/ColorPicker";
export { TextField } from "./primitives/TextField";
export { TextArea } from "./primitives/TextArea";
export { Checkbox } from "./primitives/Checkbox";
export { CheckboxGroup, CheckboxGroupItem } from "./primitives/CheckboxGroup";
export { CheckboxCards, CheckboxCardsItem } from "./primitives/CheckboxCards";
export { RadioGroup, Radio, type RadioGroupProps, type RadioProps } from "./primitives/RadioGroup";
export { Switch } from "./primitives/Switch";
export { Icon, type IconProps, type IconSizeToken, type IconColorToken, iconVariants } from "./primitives/Icon";
export { IconPicker, ALL_ICONS, ICON_REGISTRY } from "./primitives/IconPicker";
export { Combobox } from "./primitives/Combobox";
export { Slider, CapsuleSlider, type SliderProps, type CapsuleSliderProps } from "./primitives/Slider";
export { SegmentedControl, SegmentedControlItem } from "./primitives/SegmentedControl";
export { Stepper, type Step } from "./primitives/Stepper";

// Buttons
export { Button } from "./primitives/Button";
export { IconButton } from "./primitives/IconButton";

// Navigation & Display
export { Pagination, type PaginationProps } from "./primitives/Pagination";
export {
  Carousel,
  CarouselTrack,
  CarouselItem,
  CarouselControls,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  useCarousel,
  carouselVariants,
  type CarouselProps,
  type CarouselTrackProps,
  type CarouselItemProps,
} from "./primitives/Carousel";

// Typography
export { Heading, headingVariants, type HeadingProps } from "./primitives/Heading";
export { Text, textVariants, type TextProps } from "./primitives/Text";
export { Link, linkVariants, type LinkProps } from "./primitives/Link";
export { Code, type CodeProps } from "./primitives/Code";
export { Kbd, type KbdProps } from "./primitives/Kbd";
export { Blockquote, type BlockquoteProps } from "./primitives/Blockquote";
export { Em, Strong, Quote, type EmProps, type StrongProps, type QuoteProps } from "./primitives/Emphasis";

// Data display
export { Calendar, CalendarView, CalendarEventChip, type CalendarEvent, type CalendarProps, type CalendarViewMode } from "./primitives/Calendar";
export { Card, CardList, CardListItem, CardRow, StatCard } from "./primitives/Card";
export { CodeBlock, highlightCode, type CodeBlockProps, type SupportedLanguage } from "./primitives/CodeBlock";
export { CodeEditor, type CodeEditorProps } from "./primitives/CodeEditor";
export { formatChartValue, type ChartTone, type ChartYFormat, type ChartBarRadius, type ChartPadding, type AxisProps } from "./lib/chart-kit";
export { Sparkline, type SparklineProps, type SparklinePoint } from "./primitives/Sparkline";
export { LineChart, type LineChartProps } from "./primitives/LineChart";
export { BarChart, type BarChartProps } from "./primitives/BarChart";
export { Heatmap, type HeatmapProps } from "./primitives/Heatmap";
export { FunnelChart, type FunnelChartProps, type FunnelStep } from "./primitives/FunnelChart";
export { Rating, NpsScale, SentimentRating, RatingSummary, calculateNps, type RatingProps, type NpsScaleProps, type NpsResult, type SentimentRatingProps, type RatingSummaryProps } from "./primitives/Rating";
export { DonutChart, type DonutChartProps, type DonutDatum } from "./primitives/DonutChart";
export { niceScale, type SeriesSpec } from "./lib/chart-kit";
export { Badge } from "./primitives/Badge";
export { Callout } from "./primitives/Callout";
export { Avatar } from "./primitives/Avatar";
export { Image, type ImageProps } from "./primitives/Image";
export { Video, type VideoProps } from "./primitives/Video";
export { MotionPauseButton } from "./primitives/Video/PauseToggle";
export { ChatBubble, type ChatBubbleProps, type ChatRole, type ChatLayout, type ChatStatus } from "./primitives/ChatBubble";
export { Murmur, registerMurmurState, MURMUR_STATES, MURMUR_FREE_STATES, type MurmurProps, type MurmurState, type MurmurStateFn, type MurmurDot, type MurmurFrame, type MurmurOut } from "./primitives/Murmur";
export { Backdrop, registerBackdrop, BACKDROP_FREE_VARIANTS, type BackdropProps, type BackdropVariant, type BackdropRenderer } from "./primitives/Backdrop";
export { Reasoning, type ReasoningProps } from "./primitives/Reasoning";
export { ToolCall, type ToolCallProps, type ToolCallStatus, type ToolApprovalScope } from "./primitives/ToolCall";
export { FileOutput, type FileOutputProps, type FileOutputKind, type FileOutputStatus } from "./primitives/FileOutput";
export { VoiceInput, type VoiceInputProps, type VoiceInputState } from "./primitives/VoiceInput";
export { Progress } from "./primitives/Progress";
export { Spinner } from "./primitives/Spinner";
export { Skeleton, SkeletonMimic } from "./primitives/Skeleton";
export { DataList, DataListItem } from "./primitives/DataList";
export { List, ListItem } from "./primitives/List";
export { Table, TableHeader, TableBody, TableRow, TableColumnHeaderCell, TableCell } from "./primitives/Table";
export { Separator } from "./primitives/Separator";
export { Sortable, SortableHandle } from "./primitives/Sortable";
export { AspectRatio } from "./primitives/AspectRatio";
export { Inset } from "./primitives/Inset";

// Navigation
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabItem, type TabsProps } from "./primitives/Tabs";
export { Row, RowDragHandle } from "./primitives/Row";

// Layout primitives (radix-style structural building blocks)
export { Box } from "./primitives/Box";
export { Flex } from "./primitives/Flex";
export {
  ResizeHandle,
  ResizeHandles,
  resizeHandleVariants,
  type ResizeHandleProps,
  type ResizeHandleVariant,
  type ResizeHandleColor,
  type ResizableProps,
} from "./primitives/Resizable";
export {
  useResizable,
  resolveResizeEdges,
  type ResizeEdge,
  type ResizableEdges,
  type ResizeSize,
  type ResizeRadii,
  type UseResizableOptions,
  type UseResizableResult,
} from "./lib/useResizable";
export { Grid } from "./primitives/Grid";
export { Container } from "./primitives/Container";
export { Section } from "./primitives/Section";

// Layout / app chrome
export { Sidebar, SidebarHeader, SidebarBody, SidebarFooter, SidebarSection, SidebarNavItem, SidebarTrigger, useSidebar, type SidebarProps, type SidebarNavItemProps } from "./primitives/Sidebar";
export { AppFrame, useAppFrame, type AppFrameProps } from "./primitives/AppShell";
export { TopBar } from "./primitives/TopBar";

// Newly built primitives addressing gaps
export { Breadcrumbs, type BreadcrumbItem } from "./primitives/Breadcrumbs";
export {
  ActionBar,
  type ActionBarProps,
  type ActionBarGroup,
  type ActionBarItem,
} from "./primitives/ActionBar";
export {
  ToastProvider,
  useToast,
  type ToastItem,
  type ToastType,
  type ToastPosition,
} from "./primitives/Toast";
export {
  BottomNav,
  type BottomNavItem,
  type BottomNavProps,
} from "./primitives/BottomNav";
export {
  ShavinDevTools,
  ShavinDevInspector,
  type ShavinDevToolsProps,
} from "./primitives/ShavinDevTools";
export {
  BlockPreview,
  DeviceContext,
  MiniPreviewFrame,
  MiniBlockPreview,
  SafeMiniPreview,
  type BlockPreviewProps,
  type MiniPreviewFrameProps,
  type MiniBlockPreviewProps,
} from "./primitives/BlockPreview";

// Domain & URL resolvers
export {
  isLocalhost,
  getWebsiteUrl,
  getStudioUrl,
  getDocsUrl,
  getCommunityUrl,
  getKitsUrl,
  getAssetsUrl,
} from "./lib/urls";

// Design System Master Metadata & Statistics
export {
  SHAVIN_META,
  type ShavinMeta,
  type ShavinMcpTool,
} from "./lib/meta";

