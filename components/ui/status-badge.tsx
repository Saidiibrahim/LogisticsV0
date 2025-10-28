import { cn } from "@/lib/utils"
import type { EventStatus } from "@/lib/types/calendar"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "./badge"

interface StatusBadgeProps {
	status?: EventStatus
	className?: string
	showIcon?: boolean
}

const statusConfig: Record<
	EventStatus,
	{
		label: string
		variant: "secondary" | "default" | "destructive"
		icon: typeof Clock
		className: string
	}
> = {
	scheduled: {
		label: "Scheduled",
		variant: "secondary",
		icon: Clock,
		className:
			"bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
	},
	"in-progress": {
		label: "In Progress",
		variant: "default",
		icon: AlertCircle,
		className:
			"bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	completed: {
		label: "Completed",
		variant: "default",
		icon: CheckCircle2,
		className:
			"bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
	},
	cancelled: {
		label: "Cancelled",
		variant: "destructive",
		icon: XCircle,
		className:
			"bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
	},
}

export function StatusBadge({
	status,
	className,
	showIcon = true,
}: StatusBadgeProps) {
	if (!status) return null

	const config = statusConfig[status]
	if (!config) return null

	const Icon = config.icon

	return (
		<Badge
			variant={config.variant}
			className={cn("gap-1", config.className, className)}
		>
			{showIcon && <Icon className="h-3 w-3" />}
			{config.label}
		</Badge>
	)
}
