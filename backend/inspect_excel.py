import zipfile
import xml.etree.ElementTree as ET
import re

def parse_xlsx(file_path):
    with zipfile.ZipFile(file_path, 'r') as z:
        # Load shared strings if present
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            # Namespace handling
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append("".join([t.text or "" for t in text_elems]))

        # Load workbook to find sheets
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
        sheet_info = [(s.attrib.get('name'), s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')) for s in sheets]
        print("Sheets in workbook:", sheet_info)

        # Also get rels for sheet filenames
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rels = {r.attrib.get('Id'): r.attrib.get('Target') for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')}

        results = {}
        for name, rId in sheet_info:
            target = rels.get(rId)
            if not target.startswith('xl/'):
                sheet_path = 'xl/' + target if not target.startswith('/') else target[1:]
            else:
                sheet_path = target
            
            sheet_tree = ET.fromstring(z.read(sheet_path))
            rows_data = []
            for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_cells = []
                for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    cell_type = c.attrib.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else None
                    if cell_type == 's' and val is not None:
                        val = shared_strings[int(val)]
                    row_cells.append((c.attrib.get('r'), val))
                rows_data.append(row_cells)
            results[name] = rows_data
            print(f"Sheet '{name}' has {len(rows_data)} rows")

    return results, shared_strings

if __name__ == '__main__':
    data, strings = parse_xlsx('5th_sem_students_list.xlsx')
    for sheet_name, rows in data.items():
        print(f"\n--- Sheet: {sheet_name} (First 15 rows) ---")
        for r_idx, r in enumerate(rows[:15]):
            vals = [v for pos, v in r if v is not None]
            print(f"Row {r_idx+1}: {vals}")

