import { Container, Button } from "../components/ui/Storefront";
import usePageMeta from "../hooks/usePageMeta";
export default function NotFound() {
  usePageMeta(
    "Page not found",
    "This page is unavailable. Explore the R&J shop or request an AC service.",
  );
  return (
    <Container className="section-rj">
      <div className="empty-state">
        <p className="eyebrow">404 / Page not found</p>
        <h1 className="!text-4xl">Let us get you back on track.</h1>
        <p>The page may have moved, or the link may be incorrect.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button to="/">Back to Home</Button>
          <Button to="/shop" variant="secondary">
            Browse the shop
          </Button>
        </div>
      </div>
    </Container>
  );
}
