function Header() {
  return (
    <header
      style={{
        width: "100%",
        background: "#0d0d0f",
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "3px solid #c9942a",
      }}
    >
      <div>
        <h1
          style={{
            color: "#c9942a",
            fontSize: "34px",
            fontWeight: "800",
            letterSpacing: "2px",
          }}
        >
          KLIENTE
        </h1>

        <span
          style={{
            color: "#ffffff",
            fontSize: "13px",
          }}
        >
          by Mitnick Connect © 2026
        </span>
      </div>

      <div
        style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        PANADERÍA DEMO
      </div>
    </header>
  );
}

export default Header;