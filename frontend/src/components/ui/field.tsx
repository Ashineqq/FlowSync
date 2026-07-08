import * as React from "react"
import { cn } from "@/lib/utils"

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-invalid"?: boolean
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    />
  )
)
Field.displayName = "Field"

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-relaxed", className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label> 
  )
)
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: ({ message?: string } | undefined | null)[] | { message?: string } | null | undefined
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, errors, children, ...props }, ref) => {
    const msg = Array.isArray(errors) ? errors?.[0]?.message : errors?.message
    const message = msg || children
    if (!message) return null
    return (
      <p
        ref={ref}
        className={cn("text-sm text-destructive", className)}
        {...props}
      >
        {message}
      </p>
    )
  }
)
FieldError.displayName = "FieldError"

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
))
FieldGroup.displayName = "FieldGroup"

export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup }
export type { FieldProps, FieldLabelProps, FieldErrorProps }
