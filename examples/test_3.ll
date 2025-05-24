; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [23 x i8] c"http://www.example.com\00", align 1
@.strliteral.1 = private unnamed_addr constant [8 x i8] c"Round: \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.2 = private unnamed_addr constant [23 x i8] c"http://www.example.com\00", align 1
@.strliteral.3 = private unnamed_addr constant [9 x i8] c"Status: \00", align 1
@.strliteral.4 = private unnamed_addr constant [11 x i8] c" Success: \00", align 1
@fmt.bool = private unnamed_addr constant [3 x i8] c"%d\00", align 1

declare i32 @printf(i8*, ...)

define void @process_http({ i32, i1 }* "noalias" "sret" %0, i8* %1) {
entry:
  %2 = alloca i8*, align 8
  store i8* %1, i8** %2, align 8
  %url.load = load i8*, i8** %2, align 8
  %eqtmp = icmp eq i8* %url.load, getelementptr inbounds ([23 x i8], [23 x i8]* @.strliteral, i32 0, i32 0)
  br i1 %eqtmp, label %then, label %else

then:                                             ; preds = %entry
  %fieldptr = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 0
  store i32 200, i32* %fieldptr, align 4
  %fieldptr1 = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 1
  store i1 true, i1* %fieldptr1, align 1
  ret void
  br label %merge

else:                                             ; preds = %entry
  br label %merge

merge:                                            ; preds = %else, %then
  %fieldptr2 = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 0
  store i32 401, i32* %fieldptr2, align 4
  %fieldptr3 = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 1
  store i1 false, i1* %fieldptr3, align 1
  ret void
}

define void @process_http_retry({ i32, i1 }* "noalias" "sret" %0, i8* %1, i32 %2) {
entry:
  %3 = alloca i8*, align 8
  store i8* %1, i8** %3, align 8
  %4 = alloca i32, align 4
  store i32 %2, i32* %4, align 4
  %i = alloca i32, align 4
  store i32 0, i32* %i, align 4
  store i32 0, i32* %i, align 4
  %retries.load = load i32, i32* %4, align 4
  store i32 %retries.load, i32* %i, align 4
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load = load i32, i32* %i, align 4
  %gttmp = icmp sgt i32 %i.load, 0
  br i1 %gttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %retries.load1 = load i32, i32* %4, align 4
  %i.load2 = load i32, i32* %i, align 4
  %subtmp = sub i32 %retries.load1, %i.load2
  %addtmp = add i32 %subtmp, 1
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([8 x i8], [8 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %addtmp)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %resp = alloca { i32, i1 }, align 8
  %url.load = load i8*, i8** %3, align 8
  call void @process_http({ i32, i1 }* %resp, i8* %url.load)
  %fieldptr = getelementptr { i32, i1 }, { i32, i1 }* %resp, i32 0, i32 1
  %fieldload = load i1, i1* %fieldptr, align 1
  br i1 %fieldload, label %then, label %else

loopupdate:                                       ; preds = %merge
  %i.load3 = load i32, i32* %i, align 4
  %subtmp4 = sub i32 %i.load3, 1
  store i32 %subtmp4, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  %fieldptr5 = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 0
  store i32 500, i32* %fieldptr5, align 4
  %fieldptr6 = getelementptr { i32, i1 }, { i32, i1 }* %0, i32 0, i32 1
  store i1 false, i1* %fieldptr6, align 1
  ret void

then:                                             ; preds = %loopbody
  %resp.load = load { i32, i1 }, { i32, i1 }* %resp, align 4
  store { i32, i1 } %resp.load, { i32, i1 }* %0, align 4
  ret void
  br label %merge

else:                                             ; preds = %loopbody
  br label %merge

merge:                                            ; preds = %else, %then
  br label %loopupdate
}

define void @main() {
entry:
  %resp = alloca { i32, i1 }, align 8
  call void @process_http_retry({ i32, i1 }* %resp, i8* getelementptr inbounds ([23 x i8], [23 x i8]* @.strliteral.2, i32 0, i32 0), i32 10)
  %fieldptr = getelementptr { i32, i1 }, { i32, i1 }* %resp, i32 0, i32 0
  %fieldload = load i32, i32* %fieldptr, align 4
  %fieldptr1 = getelementptr { i32, i1 }, { i32, i1 }* %resp, i32 0, i32 1
  %fieldload2 = load i1, i1* %fieldptr1, align 1
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload)
  %calltmp2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @.strliteral.4, i32 0, i32 0))
  %calltmp3 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i32 0, i32 0), i1 %fieldload2)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}
