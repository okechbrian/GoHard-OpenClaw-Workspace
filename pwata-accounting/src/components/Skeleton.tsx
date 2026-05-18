interface LineProps { width?: string | number; height?: string | number; className?: string; }

function Line({ width = "100%", height = 12, className }: LineProps) {
  return <span className={`skeleton skeleton-line ${className ?? ""}`} style={{ width, height }} />;
}

function Block({ width = "100%", height = 64, className }: LineProps) {
  return <span className={`skeleton skeleton-block ${className ?? ""}`} style={{ width, height, display: "block" }} />;
}

interface CardProps { className?: string; }

function Card({ className }: CardProps) {
  return (
    <div className={`skeleton-card ${className ?? ""}`}>
      <Line width="60%" height={14} />
      <Line width="40%" height={10} />
      <Line width="80%" height={10} />
    </div>
  );
}

interface RowProps { cols?: number; count?: number; }

function Row({ cols = 4, count = 5 }: RowProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: cols }, (_, j) => (
            <Line key={j} width={`${60 + ((i + j) % 4) * 10}%`} height={12} />
          ))}
        </div>
      ))}
    </>
  );
}

const Skeleton = { Line, Block, Card, Row };
export default Skeleton;
