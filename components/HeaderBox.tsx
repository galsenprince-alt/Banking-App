const HeaderBox = ({ type = "title", title, subtext, user }: HeaderBoxProps) => {
  return (
    <div className="header-box">
      <h1 className="text-24 lg:text-26 font-semibold" style={{ color: "var(--text-strong)" }}>
        {title}
        {type === 'greeting' && (
          <span style={{ color: "var(--accent)" }}>
            &nbsp;{user}
          </span>
        )}
      </h1>
      <p className="text-14 font-normal" style={{ color: "var(--text-muted)" }}>
        {subtext}
      </p>
    </div>
  )
}

export default HeaderBox
