; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [14 x i8] c"Hello, World!\00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

declare i8* @realloc(i8*, i32)

define i32 @square(i32 %0) {
entry:
  %1 = alloca i32, align 4
  store i32 %0, i32* %1, align 4
  %i.load = load i32, i32* %1, align 4
  %i.load1 = load i32, i32* %1, align 4
  %multmp = mul i32 %i.load, %i.load1
  ret i32 %multmp
}

define void @main() {
entry:
  %calltmp = call i32 @square(i32 5)
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %calltmp)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}
