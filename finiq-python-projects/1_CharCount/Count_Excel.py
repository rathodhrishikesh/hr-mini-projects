import pandas as pd

def count_characters(input_string):
    char_counts = {}

    for char in input_string:
        if char.isalnum():
            char_counts[char] = char_counts.get(char, 0) + 1

    df = pd.DataFrame(char_counts.items(), columns=["Character", "Count"])
    df = df.sort_values("Character")

    with pd.ExcelWriter("char_counts.xlsx") as writer:
        df.to_excel(writer, index=False)

input_string = "MI0IFYDC0000000CA0igAwIBAgI111222222222UeFhfLq0sGUvjNwc1NBMotZbUZZMwDQYJKoZIhvcNAQELBQAwSDELMAkGA1UEBhMCQk0xGTAXBgNVBAoTEFF1b1ZhZGlzIExpbWl0ZWQxHjAcBgNVBAMTFVF1b1ZhZGlzIFJvb3QgQ0EgMSBHMzAeFw0xMjAxMTIxNzI3NDRaFw00MjAxMTIxNzI3NDRaMEgxCzAJBgNVBAYTAkJNMRkwFwYDVQQKExBRdW9WYWRpcyBMaW1pdGVkMR4wHAYDVQQDExVRdW9WYWRpcyBSb290IENBIDEgRzMwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCgvlAQjunybEC0BJyFuTHK3C3kEakEPBtVwedYMB0ktMPvhd6MLOHBPd"
count_characters(input_string)
