import jsPDF from 'jspdf';
import { Question } from './questionGenerator';

class PDFGenerator {
  generateQuizPDF(questions: Question[], fileName: string, config: any): Blob {
    const doc = new jsPDF();
    
    // Set up the document
    doc.setFontSize(20);
    doc.text('Quiz', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Source: ${fileName}`, 20, 30);
    doc.text(`Type: ${this.getQuizTypeDisplay(config.type)}`, 20, 40);
    doc.text(`Questions: ${config.questionCount}`, 20, 50);
    doc.text(`Difficulty: ${config.difficulty}`, 20, 60);
    
    // Add a line separator
    doc.line(20, 65, 190, 65);
    
    let yPosition = 80;
    
    questions.forEach((question, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question number and text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, 20, yPosition);
      
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(question.question, 160);
      doc.text(questionLines, 30, yPosition);
      
      yPosition += questionLines.length * 7 + 5;
      
      // Add options for multiple choice
      if (question.type === 'multiple-choice' && question.options) {
        question.options.forEach((option, optIndex) => {
          const optionText = `${String.fromCharCode(65 + optIndex)}) ${option}`;
          const optionLines = doc.splitTextToSize(optionText, 150);
          doc.text(optionLines, 35, yPosition);
          yPosition += optionLines.length * 6 + 2;
        });
      }
      
      // Add space for answers
      if (question.type === 'fill-blank' || question.type === 'true-false') {
        doc.text('Answer: ________________________', 35, yPosition);
        yPosition += 10;
      } else if (question.type === 'descriptive') {
        doc.text('Answer:', 35, yPosition);
        yPosition += 10;
        // Add lines for writing
        for (let i = 0; i < 4; i++) {
          doc.line(35, yPosition, 180, yPosition);
          yPosition += 8;
        }
      } else if (question.type === 'multiple-choice') {
        doc.text('Answer: ____', 35, yPosition);
        yPosition += 10;
      }
      
      yPosition += 10; // Space between questions
    });
    
    // Add answer key on a new page
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Answer Key', 20, 20);
    doc.line(20, 25, 190, 25);
    
    yPosition = 40;
    doc.setFontSize(11);
    
    questions.forEach((question, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${index + 1}. ${question.correctAnswer}`, 20, yPosition);
      yPosition += 8;
    });
    
    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }
  
  private getQuizTypeDisplay(type: string): string {
    const typeMap = {
      'true-false': 'True or False',
      'multiple-choice': 'Multiple Choice',
      'fill-blank': 'Fill in the Blank',
      'descriptive': 'Descriptive'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  }
}

export const pdfGenerator = new PDFGenerator();