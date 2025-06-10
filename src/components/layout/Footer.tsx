export default function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 text-center p-6 mt-auto">
      <div className="container mx-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 河內探索者。保留所有權利。
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          輕鬆舒適地探索河內。
        </p>
      </div>
    </footer>
  );
}
