"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "选择日期",
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) {
      // 使用UTC时间存储，但保留当前时区信息
      if (selectedDate) {
        // 创建UTC日期，但保持本地时区的显示
        const utcDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
        onChange(utcDate.toISOString())
      } else {
        onChange("")
      }
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: zhCN }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={zhCN}
        />
      </PopoverContent>
    </Popover>
  )
}
