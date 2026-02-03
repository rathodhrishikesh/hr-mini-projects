def count_characters(input_string):
    alphabet_count = {}
    number_count = {}
    
    for char in input_string:
        if char.isalpha():
            alphabet_count[char] = alphabet_count.get(char, 0) + 1
        elif char.isdigit():
            number_count[char] = number_count.get(char, 0) + 1

    sorted_alphabets = sorted(alphabet_count.items(), key=lambda x: x[0])
    sorted_numbers = sorted(number_count.items(), key=lambda x: x[0])

    return sorted_alphabets, sorted_numbers

def write_to_txt(sorted_alphabets, sorted_numbers):
    with open('character_count_b.txt', 'w') as file:
        file.write("Character Counts:\n")
        for char, count in sorted_alphabets:
            file.write(f"{char}: {count}\n")
        file.write("\nNumber Counts:\n")
        for num, count in sorted_numbers:
            file.write(f"{num}: {count}\n")

if __name__ == "__main__":
    input_string = "MI0IFYDC0000000CA0igAwIBAgI111222222222UeFhfLq0sGUvjNwc1NBMotZbUZZMwDQYJKoZIhvcNAQELBQAwSDELMAkGA1UEBhMCQk0xGTAXBgNVBAoTEFF1b1ZhZGlzIExpbWl0ZWQxHjAcBgNVBAMTFVF1b1ZhZGlzIFJvb3QgQ0EgMSBHMzAeFw0xMjAxMTIxNzI3NDRaFw00MjAxMTIxNzI3NDRaMEgxCzAJBgNVBAYTAkJNMRkwFwYDVQQKExBRdW9WYWRpcyBMaW1pdGVkMR4wHAYDVQQDExVRdW9WYWRpcyBSb290IENBIDEgRzMwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCgvlAQjunybEC0BJyFuTHK3C3kEakEPBtVwedYMB0ktMPvhd6MLOHBPd"
    sorted_alphabets, sorted_numbers = count_characters(input_string)
    write_to_txt(sorted_alphabets, sorted_numbers)