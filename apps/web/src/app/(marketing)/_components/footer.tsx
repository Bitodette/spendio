export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">Spendio &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
