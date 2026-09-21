"""Minimal text PDF writer so invoices do not need an extra package."""


def _escape(text):
    return (
        str(text)
        .encode("latin-1", "replace")
        .decode("latin-1")
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def build_text_pdf(title, lines):
    ops = ["BT", "/F1 16 Tf", "50 740 Td", f"({_escape(title)}) Tj", "/F1 12 Tf"]
    for line in lines:
        ops.append("0 -20 Td")
        ops.append(f"({_escape(line)}) Tj")
    ops.append("ET")
    stream = "\n".join(ops).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"
        ),
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{index} 0 obj\n".encode("ascii"))
        out.extend(obj)
        out.extend(b"\nendobj\n")

    xref_at = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        out.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.extend(
        (
            f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_at}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(out)


def render_invoice_pdf(invoice):
    application = invoice.application
    cabin = application.cabin
    patient = application.patient
    lines = [
        f"Invoice: {invoice.invoice_number}",
        f"Issued: {invoice.issued_at.date().isoformat()}",
        f"Patient: {patient.name}",
        f"Cabin: {cabin.number} ({cabin.cabin_type})",
        f"Stay: {application.start_date.isoformat()} to {application.end_date.isoformat()}",
        f"Nights: {invoice.nights}",
        f"Nightly rate: {invoice.nightly_rate}",
        f"Total: {invoice.total}",
        f"Application ID: {application.application_id}",
    ]
    return build_text_pdf("Med Life Cabin Invoice", lines)
