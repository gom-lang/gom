#include <stdio.h>
#include <stdlib.h>
int GLOBAL = 1;
int square(int x) {
  return x * x;
}
int add(int a, int b) {
  return a + b;
}
int main() {
  int a = 1 + 2;
  int b = 2;
  add(1, 1 + b / 2);
  a = 2;
  int sq = square(a);
  int i = 0;
  add(i, 1);
}