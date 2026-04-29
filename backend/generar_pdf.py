from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import date
from models import TipoPruebaEnum

# ── Paleta de Colores LabMónica (Premium) ──────────────────────────────────────
COLOR_TEAL_DARK  = colors.HexColor("#065f46") # Emerald 800
COLOR_TEAL_LIGHT = colors.HexColor("#0d9488") # Teal 600
COLOR_TEAL_SOFT  = colors.HexColor("#f0fdfa") # Teal 50
COLOR_GRAY_TEXT  = colors.HexColor("#4b5563") # Gray 600
COLOR_GRAY_LIGHT = colors.HexColor("#f9fafb") # Gray 50
COLOR_BORDER     = colors.HexColor("#e5e7eb") # Gray 200
COLOR_RED        = colors.HexColor("#dc2626") # Red 600
COLOR_BLACK      = colors.HexColor("#111827") # Gray 900

def calcular_edad(fecha_nacimiento: date, fecha_examen: date) -> str:
    if not fecha_nacimiento: return "—"
    años = fecha_examen.year - fecha_nacimiento.year
    if (fecha_examen.month, fecha_examen.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        años -= 1
    if años < 1:
        meses = (fecha_examen.year - fecha_nacimiento.year) * 12 + fecha_examen.month - fecha_nacimiento.month
        return f"{meses} meses"
    return f"{años} años"

def generar_pdf_orden(orden, paciente, pruebas_con_resultados, config) -> BytesIO:
    """
    Genera un reporte PDF premium siguiendo el estilo LabMónica.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Estilos ────────────────────────────────────────────────────────────────
    style_lab_name = ParagraphStyle("LabName", fontName="Helvetica-Bold", fontSize=22, textColor=COLOR_TEAL_DARK, leading=26, tracking=-0.5)
    style_label    = ParagraphStyle("Label", fontName="Helvetica-Bold", fontSize=8, textColor=COLOR_GRAY_TEXT, leading=10, textTransform='uppercase', tracking=1)
    style_value    = ParagraphStyle("Value", fontName="Helvetica-Bold", fontSize=11, textColor=COLOR_BLACK, leading=14)
    style_th       = ParagraphStyle("TH", fontName="Helvetica-Bold", fontSize=9, textColor=colors.white, leading=12, alignment=TA_LEFT)
    style_td       = ParagraphStyle("TD", fontName="Helvetica", fontSize=9, textColor=COLOR_BLACK, leading=12)
    style_td_bold  = ParagraphStyle("TD_Bold", fontName="Helvetica-Bold", fontSize=10, textColor=COLOR_BLACK, leading=12)
    style_unit     = ParagraphStyle("Unit", fontName="Helvetica-Oblique", fontSize=8, textColor=COLOR_GRAY_TEXT, leading=10)
    style_status   = ParagraphStyle("Status", fontName="Helvetica-Bold", fontSize=7, textColor=COLOR_TEAL_DARK, alignment=TA_CENTER, leading=8)
    style_abnormal = ParagraphStyle("Abnormal", fontName="Helvetica-Bold", fontSize=10, textColor=COLOR_RED, leading=12)
    style_category = ParagraphStyle("Category", fontName="Helvetica-Bold", fontSize=10, textColor=COLOR_TEAL_DARK, leading=14, spaceBefore=6, spaceAfter=4)
    style_footer   = ParagraphStyle("Footer", fontName="Helvetica", fontSize=8, textColor=COLOR_GRAY_TEXT, leading=10, alignment=TA_CENTER)

    # ── 1. ENCABEZADO ────────────────────────────────────────────────────────
    # Logo y Título Genérico
    header_table_data = [[
        Paragraph("LabMónica", style_lab_name),
        Paragraph("CLINICAL EXCELLENCE", ParagraphStyle("sub", fontName="Helvetica", fontSize=7, textColor=COLOR_GRAY_TEXT, tracking=2))
    ]]
    header_table = Table(header_table_data, colWidths=[6*cm, 10*cm])
    header_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'LEFT'), ('VALIGN', (0,0), (-1,-1), 'BOTTOM')]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))

    # Título del Reporte
    story.append(Paragraph("Clinical Report", ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=24, textColor=COLOR_BLACK, leading=28)))
    story.append(Paragraph("Comprehensive Diagnostic Analysis", style_td))
    story.append(Spacer(1, 0.8 * cm))

    # ── 2. DATOS DEL PACIENTE (Grid Estilizado) ──────────────────────────────
    fecha_str = orden.fecha.strftime("%d %b, %Y") if hasattr(orden.fecha, "strftime") else str(orden.fecha)
    edad_str  = calcular_edad(paciente.fecha_nacimiento, orden.fecha)
    sexo_str  = "Female" if paciente.sexo == "F" else "Male" if paciente.sexo == "M" else "N/A"

    paciente_grid = [
        [Paragraph("Patient Name", style_label), Paragraph("Patient Details", style_label), Paragraph("Report Date", style_label), Paragraph("Accession Number", style_label)],
        [Paragraph(f"{paciente.nombre} {paciente.apellido}", style_value), Paragraph(f"{edad_str}, {sexo_str}", style_value), Paragraph(fecha_str, style_value), Paragraph(f"#LM-{orden.id:06d}-TX", style_value)]
    ]
    grid_table = Table(paciente_grid, colWidths=[5*cm, 4*cm, 4*cm, 4.5*cm])
    grid_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(grid_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── 3. RESULTADOS POR EXAMEN ─────────────────────────────────────────────
    for bloque in pruebas_con_resultados:
        prueba = bloque["prueba"]
        parametros = bloque["parametros"]
        
        # Banner de Prueba
        story.append(Table([[Paragraph(f"{prueba.nombre} Results", style_th)]], 
                     colWidths=[17.5*cm], 
                     style=TableStyle([
                         ('BACKGROUND', (0,0), (-1,-1), COLOR_TEAL_LIGHT),
                         ('ROUNDEDCORNERS', [10, 10, 0, 0]),
                         ('TOPPADDING', (0,0), (-1,-1), 8),
                         ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                         ('LEFTPADDING', (0,0), (-1,-1), 15),
                     ])))

        # Cabecera de Tabla de Resultados
        table_header = [
            Paragraph("PARAMETER NAME", style_label),
            Paragraph("RESULT", style_label),
            Paragraph("REFERENCE INTERVAL", style_label),
            Paragraph("UNIT", style_label),
            Paragraph("STATUS", style_label)
        ]
        
        rows = [table_header]
        
        # Agrupar por categoría si existe
        current_cat = None
        for item in parametros:
            p_obj = item["parametro"]
            res   = item.get("resultado")
            val   = res.valor if res else "—"
            anorm = res.marcado_anormal if res else False
            rango = item.get("rango").texto_referencia if item.get("rango") else "—"
            unit  = p_obj.unidad or "—"
            cat   = getattr(p_obj, 'categoria', None)

            if cat and cat != current_cat:
                rows.append([Paragraph(cat, style_category), "", "", "", ""])
                current_cat = cat

            # Formatear el estado (Badge)
            status_text = "NORMAL" if not anorm else "ALERT"
            status_color = COLOR_TEAL_SOFT if not anorm else colors.HexColor("#fee2e2")
            
            rows.append([
                Paragraph(p_obj.nombre, style_td),
                Paragraph(val, style_abnormal if anorm else style_td_bold),
                Paragraph(rango, style_td),
                Paragraph(unit, style_unit),
                # Celda de status simulando un badge
                Table([[Paragraph(status_text, style_status)]], colWidths=[1.8*cm], style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), status_color),
                    ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 2),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
            ])

        res_table = Table(rows, colWidths=[6.5*cm, 2.5*cm, 3.5*cm, 2.5*cm, 2.5*cm])
        res_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, COLOR_BORDER),
            ('TOPPADDING', (0,1), (-1,-1), 6),
            ('BOTTOMPADDING', (0,1), (-1,-1), 6),
            ('LEFTPADDING', (0,1), (-1,-1), 8),
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ]))
        story.append(res_table)
        story.append(Spacer(1, 1 * cm))

    # ── 4. SECCIÓN TÉCNICA Y FIRMAS ──────────────────────────────────────────
    # Observaciones
    obs_texto = orden.notas_tecnicas if (hasattr(orden, 'notas_tecnicas') and orden.notas_tecnicas) else "All parameters tested for this patient fall within the established biological reference intervals unless marked otherwise. This report is certified by LabMónica Quality Control Protocol Level 3."
    
    obs_data = [[
        Paragraph("Technical Analysis & Observations", ParagraphStyle("obs_title", fontName="Helvetica-Bold", fontSize=10, textColor=COLOR_TEAL_DARK, leading=14)),
    ], [
        Paragraph(obs_texto, style_td),
    ]]
    obs_table = Table(obs_data, colWidths=[11*cm])
    obs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_GRAY_LIGHT),
        ('ROUNDEDCORNERS', [15, 15, 15, 15]),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
    ]))
    
    # Firma (Derecha)
    firma_data = [
        [Paragraph("Validated", ParagraphStyle("v", fontName="Helvetica-Bold", fontSize=14, textColor=colors.white, alignment=TA_CENTER))],
        [Paragraph(f"Lic. {config['nombre_licenciada']}", ParagraphStyle("lic", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white, alignment=TA_CENTER))],
        [Paragraph("BIOANALISTA CERTIFICADA", ParagraphStyle("bio", fontName="Helvetica", fontSize=7, textColor=colors.white, alignment=TA_CENTER, tracking=1))]
    ]
    firma_table_box = Table(firma_data, colWidths=[5*cm])
    firma_table_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_TEAL_DARK),
        ('ROUNDEDCORNERS', [20, 20, 20, 20]),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))

    # Ensamblar footer row
    footer_row = Table([[obs_table, firma_table_box]], colWidths=[12*cm, 5.5*cm])
    footer_row.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('ALIGN', (0,0), (-1,-1), 'LEFT')]))
    story.append(footer_row)

    # ── FINALIZAR ─────────────────────────────────────────────────────────────
    doc.build(story)
    buffer.seek(0)
    return buffer