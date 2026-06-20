function PhageIcon() {
  return (
    <div className="phage-icon">
      <div className="head" />
      <div className="tail" />
      <div className="fibers" />
    </div>
  );
}

export default function CardIcon({ icon }: { icon: string }) {
  if (icon === "phage") return <PhageIcon />;
  return <>{icon}</>;
}
