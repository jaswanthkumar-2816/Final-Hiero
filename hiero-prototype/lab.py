
def combination(n,k):
    if k>n:
        return 0
    k=min(k,n-k)
    result=1
    for i in range(1,k+1):
        result*= (n-i+1)/i

    return result

while True:
    try:
        k_str, r_str = input("Enter two integer values (k r): ").split()
        k = int(k_str)
        r = int(r_str)
        break
    except ValueError:
        print("Invalid input. Please enter two integers separated by a space.")

fav=combination(13,r)*combination(39,k-r)

total=combination(52,k)
prob=fav/total

print(prob)