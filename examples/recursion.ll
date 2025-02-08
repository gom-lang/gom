; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [14 x i8] c"Hello, World!\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.1 = private unnamed_addr constant [7 x i8] c"2^3 = \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1

define i32 @power_n(i32 %0, i32 %1) {
entry:
  %2 = alloca i32, align 4
  store i32 %0, i32* %2, align 4
  %3 = alloca i32, align 4
  store i32 %1, i32* %3, align 4
  %n.load = load i32, i32* %3, align 4
  %eqtmp = icmp eq i32 %n.load, 0
  br i1 %eqtmp, label %then, label %else

then:                                             ; preds = %entry
  ret i32 1
  br label %merge

else:                                             ; preds = %entry
  br label %merge

merge:                                            ; preds = %else, %then
  %x.load = load i32, i32* %2, align 4
  %x.load1 = load i32, i32* %2, align 4
  %n.load2 = load i32, i32* %3, align 4
  %subtmp = sub i32 %n.load2, 1
  %calltmp = call i32 @power_n(i32 %x.load1, i32 %subtmp)
  %multmp = mul i32 %x.load, %calltmp
  ret i32 %multmp
}

define void @main() {
entry:
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @.strliteral, i32 0, i32 0))
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %calltmp = call i32 @power_n(i32 2, i32 3)
  %calltmp01 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %calltmp)
  %newline2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}

declare i32 @printf(i8*, ...)
