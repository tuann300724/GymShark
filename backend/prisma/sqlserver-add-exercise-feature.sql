-- Tạo bảng mới cho tính năng Exercise + Program + ProgramExercise
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Program' AND xtype='U')
CREATE TABLE Program (
  id NVARCHAR(100) PRIMARY KEY,
  slug NVARCHAR(400) UNIQUE,
  name NVARCHAR(400),
  [group] NVARCHAR(400),
  duration INT,
  summary NVARCHAR(MAX),
  img NVARCHAR(400),
  alt NVARCHAR(400),
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Exercise' AND xtype='U')
CREATE TABLE Exercise (
  id NVARCHAR(100) PRIMARY KEY,
  name NVARCHAR(400),
  enName NVARCHAR(400),
  [group] NVARCHAR(400),
  equipment NVARCHAR(400),
  description NVARCHAR(MAX),
  imageUrl NVARCHAR(400),
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE()
);
CREATE INDEX IX_Exercise_name ON Exercise(name);
CREATE INDEX IX_Exercise_group ON Exercise([group]);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProgramExercise' AND xtype='U')
CREATE TABLE ProgramExercise (
  id NVARCHAR(100) PRIMARY KEY,
  programId NVARCHAR(100) NOT NULL,
  exerciseId NVARCHAR(100) NOT NULL,
  sets INT DEFAULT 3,
  reps NVARCHAR(100),
  rest NVARCHAR(400),
  orderIndex INT DEFAULT 0,
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_ProgramExercise_Program FOREIGN KEY (programId) REFERENCES Program(id) ON DELETE CASCADE,
  CONSTRAINT FK_ProgramExercise_Exercise FOREIGN KEY (exerciseId) REFERENCES Exercise(id) ON DELETE CASCADE,
  CONSTRAINT UQ_ProgramExercise_program_order UNIQUE (programId, orderIndex)
);
CREATE INDEX IX_ProgramExercise_programId ON ProgramExercise(programId);
CREATE INDEX IX_ProgramExercise_exerciseId ON ProgramExercise(exerciseId);
