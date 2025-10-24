"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxItem {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Accessible combobox built on Radix command. Provides a searchable dropdown
 * that works well for short lists such as teams, venues, or competitions.
 */
export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select item…",
  emptyMessage = "No items found.",
  searchPlaceholder = "Search…",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)

  const normalizedItems = useMemo(
    () => items.map((item) => ({ ...item, label: item.label.trim() })),
    [items]
  )

  const selectedItem = normalizedItems.find((item) => item.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {normalizedItems.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  const nextValue = item.value === value ? "" : item.value
                  onValueChange(nextValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    item.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex flex-col">
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="text-muted-foreground text-xs">
                      {item.description}
                    </span>
                  )}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
