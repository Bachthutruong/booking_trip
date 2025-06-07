export default function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 text-center p-6 mt-auto">
      <div className="container mx-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Hanoi Explorer. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Explore Hanoi with ease and comfort.
        </p>
      </div>
    </footer>
  );
}
