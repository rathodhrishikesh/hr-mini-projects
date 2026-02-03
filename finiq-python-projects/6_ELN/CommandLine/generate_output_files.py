import openpyxl
import subprocess

def read_excel(filename):
    workbook = openpyxl.load_workbook(filename)
    sheet = workbook.active
    data = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        data.append(row)
    return data

def run_eln_command(ticker, tenor, notional, strike, issuer):
    command = f"ELN_Calculator.py {ticker} {tenor} {notional} {strike} {issuer}"
    subprocess.run(command, shell=True)

def generate_output_files(input_file):
    parameters = read_excel(input_file)
    for record in parameters:
        ticker, tenor, notional, strike, issuer = record
        run_eln_command(ticker, tenor, notional, strike, issuer)

if __name__ == "__main__":
    input_file = "Input_Parameters.xlsx"
    generate_output_files(input_file)