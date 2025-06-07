
import * as React from "react"
import { cn } from "@/lib/utils"
import { Separator } from "./separator"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden", // Changed to xl and added overflow hidden
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement, // Changed to HTMLHeadingElement for semantic correctness
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 // Changed to h3, but could be h2, h4 etc. depending on context
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement, // Changed for semantic correctness
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p // Changed to p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const CardSection = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ title, icon, action, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold flex items-center">
          {icon && React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 mr-2 text-primary"})}
          {title}
        </h4>
        {action}
      </div>
      {children}
      <Separator className="mt-6 -mx-6 w-[calc(100%+3rem)]" /> {/* Full width separator */}
    </div>
  )
);
CardSection.displayName = "CardSection";


export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardSection }
