; ModuleID = 'mod'
source_filename = "mod"

%Point = type { i32, i32 }
%Line = type { %Point, %Point }

@GLOBAL = external global i32
@.strliteral = private unnamed_addr constant [29 x i8] c"Distance between p1 and p2: \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.1 = private unnamed_addr constant [33 x i8] c"Distance between l.p1 and l.p2: \00", align 1

define i32 @square(i32 %0) {
entry:
  %1 = alloca i32, align 4
  store i32 %0, i32* %1, align 4
  %x.load = load i32, i32* %1, align 4
  %x.load1 = load i32, i32* %1, align 4
  %multmp = mul i32 %x.load, %x.load1
  ret i32 %multmp
}

define i32 @add(i32 %0, i32 %1) {
entry:
  %2 = alloca i32, align 4
  store i32 %0, i32* %2, align 4
  %3 = alloca i32, align 4
  store i32 %1, i32* %3, align 4
  %a.load = load i32, i32* %2, align 4
  %b.load = load i32, i32* %3, align 4
  %addtmp = add i32 %a.load, %b.load
  ret i32 %addtmp
}

define i32 @distance(%Point %0, %Point %1) {
entry:
  %2 = alloca %Point, align 8
  store %Point %0, %Point* %2, align 4
  %3 = alloca %Point, align 8
  store %Point %1, %Point* %3, align 4
  %fieldptr = getelementptr %Point, %Point* %2, i32 0, i32 0
  %fieldload = load i32, i32* %fieldptr, align 4
  %fieldptr1 = getelementptr %Point, %Point* %3, i32 0, i32 0
  %fieldload2 = load i32, i32* %fieldptr1, align 4
  %subtmp = sub i32 %fieldload, %fieldload2
  %calltmp = call i32 @square(i32 %subtmp)
  %fieldptr3 = getelementptr %Point, %Point* %2, i32 0, i32 1
  %fieldload4 = load i32, i32* %fieldptr3, align 4
  %fieldptr5 = getelementptr %Point, %Point* %3, i32 0, i32 1
  %fieldload6 = load i32, i32* %fieldptr5, align 4
  %subtmp7 = sub i32 %fieldload4, %fieldload6
  %calltmp8 = call i32 @square(i32 %subtmp7)
  %addtmp = add i32 %calltmp, %calltmp8
  ret i32 %addtmp
}

define void @main() {
entry:
  %p1 = alloca %Point, align 8
  %fieldptr = getelementptr %Point, %Point* %p1, i32 0, i32 0
  store i32 1, i32* %fieldptr, align 4
  %fieldptr1 = getelementptr %Point, %Point* %p1, i32 0, i32 1
  store i32 2, i32* %fieldptr1, align 4
  %p2 = alloca %Point, align 8
  %fieldptr2 = getelementptr %Point, %Point* %p2, i32 0, i32 0
  store i32 3, i32* %fieldptr2, align 4
  %fieldptr3 = getelementptr %Point, %Point* %p2, i32 0, i32 1
  store i32 4, i32* %fieldptr3, align 4
  %d = alloca i32, align 4
  %p1.load = load %Point, %Point* %p1, align 4
  %p2.load = load %Point, %Point* %p2, align 4
  %calltmp = call i32 @distance(%Point %p1.load, %Point %p2.load)
  store i32 %calltmp, i32* %d, align 4
  %d.load = load i32, i32* %d, align 4
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([29 x i8], [29 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %d.load)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %l = alloca %Line, align 8
  %p1.load4 = load %Point, %Point* %p1, align 4
  %fieldptr5 = getelementptr %Line, %Line* %l, i32 0, i32 0
  store %Point %p1.load4, %Point* %fieldptr5, align 4
  %p2.load6 = load %Point, %Point* %p2, align 4
  %fieldptr7 = getelementptr %Line, %Line* %l, i32 0, i32 1
  store %Point %p2.load6, %Point* %fieldptr7, align 4
  %fieldptr8 = getelementptr %Line, %Line* %l, i32 0, i32 0
  %fieldload = load %Point, %Point* %fieldptr8, align 4
  %fieldptr9 = getelementptr %Line, %Line* %l, i32 0, i32 1
  %fieldload10 = load %Point, %Point* %fieldptr9, align 4
  %calltmp11 = call i32 @distance(%Point %fieldload, %Point %fieldload10)
  %calltmp012 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([33 x i8], [33 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp113 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %calltmp11)
  %newline14 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}

declare i32 @printf(i8*, ...)
